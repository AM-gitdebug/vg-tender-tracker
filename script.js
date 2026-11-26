let allTenders = [];

fetch("./tenders.csv")
    .then(response => {
        if (!response.ok) {
            throw new Error("Unable to load tenders.csv");
        }
        return response.text();
    })
    .then(data => {

        const rows = data.trim().split(/\r?\n/);

        allTenders = rows.slice(1)
            .filter(row => row.trim() !== "")
            .map(row => {

                const cols = row.split(",").map(col => col.trim());

                return {
                    state: cols[0],
                    authority: cols[1],
                    sites: cols[2],
                    chargers: cols[3],
                    type: cols[4],
                    dueDate: cols[5],
                    status: cols[6],
                    document: cols[7]
                };
            });

        updateCounters();
        populateFilters();
        applyFilters();

        // Search
        document.getElementById("searchBox")
            .addEventListener("input", applyFilters);

        // Dropdown filters
        document.getElementById("stateFilter")
            .addEventListener("change", applyFilters);

        document.getElementById("statusFilter")
            .addEventListener("change", applyFilters);

        document.getElementById("typeFilter")
            .addEventListener("change", applyFilters);

        // Sorting
        document.getElementById("sortFilter")
            .addEventListener("change", applyFilters);

        // Clear all filters
        document.getElementById("clearFilters")
            .addEventListener("click", clearFilters);

    })
    .catch(error => {
        console.error(error);
        document.getElementById("resultCount").innerText =
            "Unable to load tender data.";
    });


// 1. Update dashboard counters

function updateCounters() {

    const counts = {
        "Live": 0,
        "Upcoming": 0,
        "Under Evaluation": 0,
        "Awarded": 0
    };

    allTenders.forEach(tender => {
        if (counts[tender.status] !== undefined) {
            counts[tender.status]++;
        }
    });

    document.getElementById("liveCount").innerText = counts["Live"];
    document.getElementById("upcomingCount").innerText = counts["Upcoming"];
    document.getElementById("evaluationCount").innerText = counts["Under Evaluation"];
    document.getElementById("awardedCount").innerText = counts["Awarded"];
}


// 2. Populate state and tender type dropdowns

function populateFilters() {

    const states = [...new Set(allTenders.map(t => t.state))].sort();
    const types = [...new Set(allTenders.map(t => t.type))].sort();

    const stateFilter = document.getElementById("stateFilter");
    const typeFilter = document.getElementById("typeFilter");

    states.forEach(state => {
        stateFilter.add(new Option(state, state));
    });

    types.forEach(type => {
        typeFilter.add(new Option(type, type));
    });
}


// 3. Search, filter and sort

function applyFilters() {

    const search = document.getElementById("searchBox")
        .value.toLowerCase().trim();

    const state = document.getElementById("stateFilter").value;
    const status = document.getElementById("statusFilter").value;
    const type = document.getElementById("typeFilter").value;
    const sort = document.getElementById("sortFilter").value;

    let filtered = allTenders.filter(tender => {

        const searchableText = [
            tender.state,
            tender.authority,
            tender.type,
            tender.status,
            tender.dueDate
        ].join(" ").toLowerCase();

        return (
            searchableText.includes(search) &&
            (!state || tender.state === state) &&
            (!status || tender.status === status) &&
            (!type || tender.type === type)
        );
    });

    // Sorting
    if (sort === "stateAsc") {
        filtered.sort((a, b) =>
            a.state.localeCompare(b.state)
        );
    }

else if (sort === "dateAsc") {
    filtered.sort((a, b) => compareDueDates(a, b, 1));
}

else if (sort === "dateDesc") {
    filtered.sort((a, b) => compareDueDates(a, b, -1));
}

    else if (sort === "sitesDesc") {
        filtered.sort((a, b) =>
            numericValue(b.sites) - numericValue(a.sites)
        );
    }

    else if (sort === "chargersDesc") {
        filtered.sort((a, b) =>
            numericValue(b.chargers) - numericValue(a.chargers)
        );
    }

    displayTenders(filtered);

    document.getElementById("resultCount").innerText =
        "Showing " + filtered.length + " of " +
        allTenders.length + " tenders";
}


// 4. Convert bid dates into sortable numbers

function getDateValue(dateString) {

    if (!dateString || dateString.toUpperCase() === "TBD") {
        return Infinity;
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return Infinity;
    }

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = Number(parts[0]);
    const month = months.indexOf(parts[1]);
    const year = Number(parts[2]);

    if (month === -1 || !day || !year) {
        return Infinity;
    }

    const fullYear = year < 100 ? 2000 + year : year;

    return new Date(fullYear, month, day).getTime();
}


// 5. Convert numeric fields safely

function numericValue(value) {

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}


// 6. Display filtered tenders

function displayTenders(tenders) {

    const tbody = document.querySelector("#tenderTable tbody");

    tbody.innerHTML = "";

    if (tenders.length === 0) {

        tbody.innerHTML =
            '<tr><td colspan="8">No matching tenders found.</td></tr>';

        return;
    }

    tenders.forEach(tender => {

        const tr = document.createElement("tr");

        const statusClasses = {
            "Live": "status-live",
            "Upcoming": "status-upcoming",
            "Under Evaluation": "status-evaluation",
            "Awarded": "status-awarded"
        };

        const values = [
            tender.state,
            tender.authority,
            tender.sites,
            tender.chargers,
            tender.type,
            tender.dueDate
        ];

        values.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        const statusCell = document.createElement("td");
        statusCell.textContent = tender.status;
        statusCell.className =
            statusClasses[tender.status] || "";

        tr.appendChild(statusCell);

        const documentCell = document.createElement("td");
        const link = document.createElement("a");

        link.href = tender.document;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open";

        documentCell.appendChild(link);
        tr.appendChild(documentCell);

        tbody.appendChild(tr);

    });
}


// 7. Clear all filters

function clearFilters() {

    document.getElementById("searchBox").value = "";
    document.getElementById("stateFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("typeFilter").value = "";
    document.getElementById("sortFilter").value = "default";

    applyFilters();
}

function compareDueDates(a, b, direction) {

    const dateA = getDateValue(a.dueDate);
    const dateB = getDateValue(b.dueDate);

    if (dateA === Infinity) return dateB === Infinity ? 0 : 1;
    if (dateB === Infinity) return -1;

    return direction * (dateA - dateB);
}
