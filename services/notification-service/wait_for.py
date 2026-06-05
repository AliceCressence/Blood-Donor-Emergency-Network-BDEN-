import os
import socket
import sys
import time


def wait_for(target: str, deadline: float) -> None:
    host, port_text = target.rsplit(":", 1)
    port = int(port_text)

    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=3):
                print(f"{target} is reachable", flush=True)
                return
        except OSError as exc:
            print(f"waiting for {target}: {exc}", flush=True)
            time.sleep(3)

    raise TimeoutError(f"timed out waiting for {target}")


def main() -> None:
    targets = [target.strip() for target in os.environ.get("WAIT_FOR_HOSTS", "").split(",") if target.strip()]
    deadline = time.time() + int(os.environ.get("WAIT_FOR_TIMEOUT", "300"))

    for target in targets:
        wait_for(target, deadline)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(exc, file=sys.stderr, flush=True)
        sys.exit(1)
