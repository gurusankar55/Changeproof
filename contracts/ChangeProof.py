# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class ChangeProof(gl.Contract):
    source_url: str
    source_name: str
    last_snapshot: str
    last_status: str

    def __init__(self, source_name: str, source_url: str):
        self.source_name = source_name
        self.source_url = source_url
        self.last_snapshot = ""
        self.last_status = "NOT_CHECKED"

    @gl.public.view
    def get_source(self) -> str:
        return self.source_url

    @gl.public.view
    def get_source_name(self) -> str:
        return self.source_name

    @gl.public.view
    def get_status(self) -> str:
        return self.last_status

    @gl.public.view
    def get_snapshot(self) -> str:
        return self.last_snapshot

    @gl.public.write
    def register_source(self, source_name: str, source_url: str) -> None:
        self.source_name = source_name
        self.source_url = source_url
        self.last_snapshot = ""
        self.last_status = "NOT_CHECKED"

    @gl.public.view
    def classify_change(self, old_text: str, new_text: str) -> str:
        if old_text == new_text:
            return "NO_CHANGE"

        old_words = old_text.split()
        new_words = new_text.split()

        if len(old_words) == 0:
            return "MATERIAL_CHANGE"

        difference = abs(len(new_words) - len(old_words))
        ratio = difference / len(old_words)

        if ratio <= 0.20:
            return "MINOR_CHANGE"

        return "MATERIAL_CHANGE"

    @gl.public.write
    def capture_snapshot(self) -> None:
        source_url = self.source_url

        def fetch_current():
            response = gl.nondet.web.get(source_url)

            if response.status < 200 or response.status >= 300:
                return "__SOURCE_UNAVAILABLE__"

            body = response.body

            if isinstance(body, bytes):
                body = body.decode("utf-8")

            normalized = " ".join(body.split())
            return normalized[:12000]

        current_snapshot = gl.eq_principle.strict_eq(fetch_current)

        if current_snapshot == "__SOURCE_UNAVAILABLE__":
            self.last_status = "SOURCE_UNAVAILABLE"
            return

        if self.last_snapshot == "":
            self.last_snapshot = current_snapshot
            self.last_status = "SNAPSHOT_CAPTURED"
        else:
            self.last_status = self.classify_change(
                self.last_snapshot,
                current_snapshot
            )
            self.last_snapshot = current_snapshot
   