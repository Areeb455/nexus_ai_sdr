def test_create_and_get_lead(auth_client):
    res = auth_client.post("/api/v1/leads", json={
        "company_name": "Acme SaaS Solutions",
        "contact_name": "Jordan Bell",
        "contact_email": "jordan@acmesaas.io",
        "role": "VP of Sales",
        "website": "https://acmesaas.io",
        "industry": "B2B SaaS",
        "company_size": "150 employees",
        "location": "Austin, TX",
        "notes": "Fast growing startup"
    })
    assert res.status_code == 201
    lead_id = res.json()["id"]

    get_res = auth_client.get(f"/api/v1/leads/{lead_id}")
    assert get_res.status_code == 200
    assert get_res.json()["company_name"] == "Acme SaaS Solutions"
    assert get_res.json()["status"] == "NEW"

def test_list_and_filter_leads(auth_client):
    auth_client.post("/api/v1/leads", json={
        "company_name": "Fintech Alpha",
        "contact_name": "Sarah Connor",
        "industry": "Fintech"
    })
    auth_client.post("/api/v1/leads", json={
        "company_name": "BioHealth Beta",
        "contact_name": "John Connor",
        "industry": "Healthcare"
    })

    res = auth_client.get("/api/v1/leads?search=Alpha")
    assert res.status_code == 200
    assert res.json()["total"] >= 1
    assert any(item["company_name"] == "Fintech Alpha" for item in res.json()["items"])

def test_dashboard_metrics(auth_client):
    res = auth_client.get("/api/v1/leads/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "total_leads" in data
    assert "conversion_rate_percentage" in data
