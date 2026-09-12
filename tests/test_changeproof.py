def test_initial_state(direct_deploy):
    contract = direct_deploy(
        "contracts/ChangeProof.py",
        "Example Docs",
        "https://example.com/"
    )

    assert contract.get_source() == "https://example.com/"
    assert contract.get_status() == "NOT_CHECKED"
    assert contract.get_snapshot() == ""
def test_register_source(direct_deploy):
    contract = direct_deploy(
        "contracts/ChangeProof.py",
        "Example Docs",
        "https://example.com/"
    )

    contract.register_source(
        "GenLayer Docs",
        "https://docs.genlayer.com/"
    )

    assert contract.get_source_name() == "GenLayer Docs"
    assert contract.get_source() == "https://docs.genlayer.com/"
    assert contract.get_status() == "NOT_CHECKED"
    assert contract.get_snapshot() == ""

def test_classify_change(direct_deploy):
    contract = direct_deploy(
        "contracts/ChangeProof.py",
        "Example Docs",
        "https://example.com/"
    )

    assert contract.classify_change(
        "API rate limit is 100 requests per minute.",
        "API rate limit is 100 requests per minute."
    ) == "NO_CHANGE"

    assert contract.classify_change(
        "API rate limit is 100 requests per minute.",
        "API rate limit is 100 requests per minute today."
    ) == "MINOR_CHANGE"

    assert contract.classify_change(
        "API rate limit is 100 requests per minute.",
        "API rate limit is 20 requests per minute and authentication is now required."
    ) == "MATERIAL_CHANGE"

def test_capture_snapshot(direct_vm, direct_deploy):
    direct_vm.mock_web(
        r"https://example\.com/",
        {
            "status": 200,
            "body": "API rate limit is 100 requests per minute.",
        },
    )

    contract = direct_deploy(
        "contracts/ChangeProof.py",
        "Example Docs",
        "https://example.com/",
    )

    contract.capture_snapshot()

    assert contract.get_snapshot() == "API rate limit is 100 requests per minute."
    assert contract.get_status() == "SNAPSHOT_CAPTURED"

def test_capture_snapshot_detects_change(direct_vm, direct_deploy):
    direct_vm.mock_web(
        r"https://example\.com/",
        {
            "status": 200,
            "body": "API rate limit is 100 requests per minute.",
        },
    )

    contract = direct_deploy(
        "contracts/ChangeProof.py",
        "Example Docs",
        "https://example.com/",
    )

    contract.capture_snapshot()

    direct_vm.clear_mocks()

    direct_vm.mock_web(
        r"https://example\.com/",
        {
            "status": 200,
            "body": "API rate limit is 20 requests per minute and authentication is now required.",
        },
    )

    contract.capture_snapshot()

    assert contract.get_status() == "MATERIAL_CHANGE"

def test_source_unavailable(direct_vm, direct_deploy):
    direct_vm.mock_web(
        r"https://example\.com/",
        {
            "status": 503,
            "body": "Service Unavailable",
        },
    )

    contract = direct_deploy(
        "contracts/ChangeProof.py",
        "Example Docs",
        "https://example.com/",
    )

    contract.capture_snapshot()

    assert contract.get_status() == "SOURCE_UNAVAILABLE"


