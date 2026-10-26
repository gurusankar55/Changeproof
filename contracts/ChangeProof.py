# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class ChangeProof(gl.Contract):
    source_url: str
    source_name: str
    last_snapshot: str
    last_status: str
    last_severity: str
    history: DynArray[str]

    def __init__(self, source_name: str, source_url: str):
        self.source_name = source_name
        self.source_url = source_url
        self.last_snapshot = ""
        self.last_status = "NOT_CHECKED"
        self.last_severity = "NONE"

    # ---------- READ FUNCTIONS ----------

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

    @gl.public.view
    def get_severity(self) -> str:
        return self.last_severity

    @gl.public.view
    def get_history_count(self) -> int:
        return len(self.history)

    @gl.public.view
    def get_history_entry(self, index: int) -> str:
        if index < 0 or index >= len(self.history):
            return ""
        return self.history[index]

    @gl.public.view
    def get_history(self) -> str:
        lines = []
        for entry in self.history:
            lines.append(entry)
        return "\n".join(lines)

    # ---------- WRITE FUNCTIONS ----------

    @gl.public.write
    def register_source(self, source_name: str, source_url: str) -> None:
        self.source_name = source_name
        self.source_url = source_url
        self.last_snapshot = ""
        self.last_status = "NOT_CHECKED"
        self.last_severity = "NONE"
        self._add_history("SOURCE_REGISTERED", "NONE")

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
            self.last_severity = "NONE"
            self._add_history("SOURCE_UNAVAILABLE", "NONE")
            return

        if self.last_snapshot == "":
            self.last_snapshot = current_snapshot
            self.last_status = "SNAPSHOT_CAPTURED"
            self.last_severity = "NONE"
            self._add_history("SNAPSHOT_CAPTURED", "NONE")
            return

        status = self.classify_change(self.last_snapshot, current_snapshot)

        if status == "NO_CHANGE":
            severity = "NONE"
        else:
            severity = self._rate_severity(self.last_snapshot, current_snapshot)

        self.last_status = status
        self.last_severity = severity
        self.last_snapshot = current_snapshot
        self._add_history(status, severity)

    # ---------- INTERNAL HELPERS ----------

    def _add_history(self, status: str, severity: str) -> None:
        number = len(self.history) + 1
        entry = str(number) + "|" + self.source_name + "|" + status + "|" + severity
        self.history.append(entry)

    def _rate_severity(self, old_text: str, new_text: str) -> str:
        old_part = old_text[:4000]
        new_part = new_text[:4000]
        name = self.source_name

        def ask_ai():
            prompt = (
                "You compare two versions of the public web page '" + name + "'.\n"
                "Rate how important the change is for users who depend on this page.\n"
                "LOW = wording, layout or typo changes.\n"
                "MEDIUM = new or removed information that users should notice.\n"
                "HIGH = changes to prices, limits, rules, requirements or terms.\n"
                "CRITICAL = changes that can break integrations, cause money loss "
                "or remove access.\n"
                "Answer with exactly one word: LOW, MEDIUM, HIGH or CRITICAL.\n\n"
                "OLD VERSION:\n" + old_part + "\n\n"
                "NEW VERSION:\n" + new_part + "\n"
            )
            result = gl.nondet.exec_prompt(prompt)
            answer = str(result).strip().upper()

            for label in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
                if label in answer:
                    return label
            return "UNKNOWN"

        return gl.eq_principle.strict_eq(ask_ai)
