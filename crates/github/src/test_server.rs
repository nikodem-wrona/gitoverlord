//! A local HTTP server for tests. It gives one prepared answer for each request.

use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::mpsc::{Receiver, channel};
use std::thread;

use crate::GitHub;

/// A request that the server received.
pub(crate) struct Recorded {
    pub(crate) path: String,
    pub(crate) authorization: Option<String>,
    pub(crate) body: String,
}

pub(crate) struct TestServer {
    url: String,
    requests: Receiver<Recorded>,
}

impl TestServer {
    /// A client that sends the API requests and the sign-in requests to this server.
    pub(crate) fn client(&self, token: Option<&str>) -> GitHub {
        GitHub::with_hosts(&self.url, &self.url, token.map(str::to_owned))
    }

    /// The next request that the server received.
    pub(crate) fn request(&self) -> Recorded {
        self.requests
            .recv()
            .expect("the server received no request")
    }
}

/// Starts a server that answers each request with the next `(status, body)`.
pub(crate) fn serve(answers: Vec<(u16, &'static str)>) -> TestServer {
    let listener = TcpListener::bind("127.0.0.1:0").expect("no local port");
    let url = format!("http://{}", listener.local_addr().expect("no address"));
    let (sender, requests) = channel();
    thread::spawn(move || {
        for (status, body) in answers {
            let Ok((stream, _)) = listener.accept() else {
                return;
            };
            let _ = sender.send(answer(stream, status, body));
        }
    });
    TestServer { url, requests }
}

fn answer(mut stream: TcpStream, status: u16, body: &str) -> Recorded {
    let mut reader = BufReader::new(stream.try_clone().expect("no stream"));
    let mut line = String::new();
    reader.read_line(&mut line).expect("no request line");
    let path = line.split(' ').nth(1).unwrap_or_default().to_owned();
    let (mut length, mut authorization, mut chunked) = (0, None, false);
    loop {
        let mut header = String::new();
        reader.read_line(&mut header).expect("no header");
        let header = header.trim_end();
        if header.is_empty() {
            break;
        }
        let (name, value) = header.split_once(": ").unwrap_or_default();
        match name.to_ascii_lowercase().as_str() {
            "content-length" => length = value.parse().unwrap_or(0),
            "authorization" => authorization = Some(value.to_owned()),
            "transfer-encoding" => chunked = value.contains("chunked"),
            _ => {}
        }
    }
    let request_body = if chunked {
        read_chunks(&mut reader)
    } else {
        let mut body = vec![0; length];
        reader.read_exact(&mut body).expect("no body");
        body
    };
    let reply = format!(
        "HTTP/1.1 {status} X\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
    stream.write_all(reply.as_bytes()).expect("no reply");
    Recorded {
        path,
        authorization,
        body: String::from_utf8_lossy(&request_body).into_owned(),
    }
}

/// Reads a body in chunks. Each chunk starts with its length in hexadecimal.
fn read_chunks(reader: &mut impl BufRead) -> Vec<u8> {
    let mut body = Vec::new();
    loop {
        let mut size = String::new();
        reader.read_line(&mut size).expect("no chunk size");
        let size = usize::from_str_radix(size.trim(), 16).unwrap_or(0);
        let mut chunk = vec![0; size + 2];
        reader.read_exact(&mut chunk).expect("no chunk");
        if size == 0 {
            return body;
        }
        body.extend_from_slice(&chunk[..size]);
    }
}
