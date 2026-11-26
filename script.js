fetch("tenders.csv")
.then(response => response.text())
.then(data => {
	let rows = data.trim().split("\n");
	let tbody = document.querySelector("#tenderTable tbody");
	let live = 0;
	let upcoming = 0;
	let closed = 0;
	let awarded = 0;
	rows.slice(1).forEach(row => {
		let cols = row.split(",").map(col => col.trim());
		let status = cols[6];
		let cssClass = "";
		if (status === "Live"){
			cssClass = "status-live";
			live++;
		}
		else if (status === "Upcoming"){	
			cssClass = "status-upcoming";
			upcoming++;
		}
		else if (status === "Closed"){
			cssClass = "status-closed";
			closed++;
		}
		else{
			cssClass="status-awarded";
			awarded++;
		}
		let tr= document.createElement("tr");
		tr.innerHTML= `
		<td>${cols[0]}</td>
		<td>${cols[1]}</td>
		<td>${cols[2]}</td>
		<td>${cols[3]}</td>
		<td>${cols[4]}</td>
		<td>${cols[5]}</td>
		<td class="${cssClass}">${status}</td>
		<td><a href="${cols[7]}" target="_blank">Open</a></td>
		`;
		tbody.appendChild(tr);
	});
	document.getElementById("liveCount").innerText = live;
	document.getElementById("upcomingCount").innerText = upcoming; 
	document.getElementById("closedCount").innerText = closed;
	document.getElementById("awardedCount").innerText = awarded;
	});
