(function (window, document) {
	"use strict";
	var renderSheet = function (ts) {
		var HOURS_PER_DAY = 7.7;
		var workDays = 0;
		var workedTotal = 0;
		var data = JSON.parse(window.sessionStorage.getItem("db"))[ts.getFullYear()][ts.getMonth()+1];
		var pretty = function (value, precision) {
			return value.toFixed(precision || 2).replace(".", ",");
		};
		var parseTime = function (value) {
			value = value || "0:00";
			value = value.split(":");
			value = parseInt(value[0], 10) + (parseInt(value[1], 10) / 60);
			return value;
		};
		var makeCell = function (index, set) {
			var header = document.querySelectorAll("th")[index];
			set = typeof set === "object" ? set : {text: set};
			set.className = header.className + (set.className ? " " + set.className : "");
			set.format = header.getAttribute("data-format");
			var cell = document.createElement("td");
			cell.textContent = set.text || set.format || "";
			if (set.className) {
				cell.className = set.className;
			}
			if (set.format) {
				cell.setAttribute("data-format", set.format);
				if (set.format === "0:00") {
					cell.setAttribute("data-value", parseTime(set.text));
				}
			}
			return cell;
		};
		document.querySelector("tbody").innerHTML = "";
		do {
			var row = document.createElement("tr");
			var rowData = data[ts.getDate()] || {};
			if (ts.getDay() % 6 && "Feiertag" !== rowData.comment) {
				workDays++;
				row.setAttribute("data-work", "1");
			} else {
				row.setAttribute("data-work", "0");
			}
			var worked = parseTime(rowData.to) - parseTime(rowData.from) - (parseTime(rowData.breakTo) - parseTime(rowData.breakFrom));
			workedTotal += worked;
			row.appendChild(makeCell(0, ts.getDate()));
			row.appendChild(makeCell(1, rowData.from));
			row.appendChild(makeCell(2, rowData.to));
			row.appendChild(makeCell(3, rowData.breakFrom));
			row.appendChild(makeCell(4, rowData.breakTo));
			row.appendChild(makeCell(5, pretty(worked)));
			row.appendChild(makeCell(6));
			row.appendChild(makeCell(7, rowData.comment));
			document.querySelector("tbody").appendChild(row);
			ts.setDate(ts.getDate() + 1);
		} while (ts.getDate() !== 1);
		document.querySelector("[data-field=total]").textContent = pretty(workedTotal);
		document.querySelector("[data-field=days]").textContent = workDays;
		document.querySelector("[data-field=hours]").textContent = pretty(workDays * HOURS_PER_DAY, 1);
	};
	var refreshData = function (event) {
		var data = window.sessionStorage.getItem("db");
		if (!data) {
			return;
		}
		data = JSON.parse(data);
		var container = document.querySelector("[data-field=period]");
		container.innerHTML = "";
		var select = document.createElement("select");
		Object.keys(data).forEach(function(year) {
			Object.keys(data[year]).forEach(function(month) {
				var period = new Date(year, month, 1);
				var option = document.createElement("option");
				option.value = period.toISOString().slice(0, 7);
				option.textContent = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][period.getMonth() - 1] + " " + period.getFullYear();
				select.appendChild(option);
			});
		});
		select.setAttribute("id", "period");
		select.setAttribute("name", "period");
		select.classList.add("screen");
		select.lastChild.selected = true;
		container.appendChild(select);
		var label = document.createElement("label");
		label.setAttribute("for", "period");
		container.appendChild(label);
		var refresh = function (event) {
			var selected = event.target.querySelector(":checked");
			document.querySelector("label[for=period]").textContent = selected.textContent;
			renderSheet(new Date(selected.value));
		};
		select.addEventListener("change", refresh);
		refresh({target: select});
	};
	var readFile = function (event) {
		var implemented = {
			"day;from;to;break;breakTo;comment": {DELIMITER: ";", COL: {DATE: 0, FROM: 1, TO: 2, BREAK_FROM: 3, BREAK_TO: 4, COMMENT: 5}}
		};
		var csv = this.result.replace(/\r/g, "").split("\n");
		var csvFormat = implemented[csv[0]];
		if (!csvFormat) {
			alert("Unrecognized file format.");
			return;
		}
		var assign = function assign (node, keyChain, value) {
			if (keyChain.length > 1) {
				node[keyChain[0]] = node[keyChain[0]] || {};
				assign(node[keyChain[0]], keyChain.slice(1), value);
			} else {
				node[keyChain[0]] = value;
			}
		};
		var data = {};
		csv.slice(1).forEach(function (row) {
			var cols = row.split(csvFormat.DELIMITER);
			var dt = cols[csvFormat.COL.DATE];
			if (dt) {
				dt = new Date(dt);
				assign(data, [dt.getFullYear(), dt.getMonth() + 1, dt.getDate()], {
					from: cols[csvFormat.COL.FROM] || undefined,
					to: cols[csvFormat.COL.TO] || undefined,
					breakFrom: cols[csvFormat.COL.BREAK_FROM] || undefined,
					breakTo: cols[csvFormat.COL.BREAK_TO] || undefined,
					comment: cols[csvFormat.COL.COMMENT] || undefined
				});
			}
		});
		window.sessionStorage.setItem("db", JSON.stringify(data));
		refreshData();
	};
	document.querySelector("#print").addEventListener("click", function (event) {
		window.print();
	});
	document.querySelector("#file").addEventListener("change", function (event) {
		var files = event.target.files;
		var file = files[0];
		var reader = new FileReader();
		reader.onload = readFile;
		reader.readAsText(file);
	});
	[].forEach.call(document.querySelectorAll("[data-field][contenteditable]"), function (item) {
		var key = item.getAttribute("data-field");
		var value = window.localStorage.getItem(key);
		if (value !== null) {
			item.textContent = value;
		}
		item.addEventListener("blur", function (event) {
			var key = event.target.getAttribute("data-field");
			var value = event.target.textContent;
			window.localStorage.setItem(key, value);
		});
	});
	refreshData();
}(window, document));
