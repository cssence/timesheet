(function (window, document) {
	"use strict";
	var now = new Date();
	document.querySelector("#year").value = now.getFullYear();
	document.querySelector("#month").value = (now.getMonth() + (now.getDate() > 19 ? 1 : 0)) || 12;
	document.querySelector("form").addEventListener("submit", function (event) {
		event.preventDefault();
		var HOURS_PER_DAY = 7.7;
		var COL_WORK_FROM = 0;
		var COL_WORK_TO = 1;
		var COL_BREAK_FROM = 2;
		var COL_BREAK_TO = 3;
		var COL_COMMENT = 4;
		var workDays = 0;
		var workedTotal = 0;
		var data = document.querySelector("#clipboard").value.replace(/\r/g, "").split("\n");
		var month = parseInt(document.querySelector("#month").value, 10);
		var year = parseInt(document.querySelector("#year").value, 10);
		var start = 1;
		var end = new Date(year, month, 0).getDate();
		document.querySelector("[data-field=employee]").textContent = document.querySelector("#employee").value;
		document.querySelector("[data-field=period]").textContent = document.querySelector("#month option:checked").textContent + " " + year;
		var pretty = function (value, precision) {
			precision = precision || 2;
			value = "00" + Math.round(value * Math.pow(10, precision));
			return parseInt(value.slice(0, value.length - precision), 10) + "," + value.slice(-precision);
		};
		var parseTime = function (value, pretty) {
			value = value || "0:00";
			value = value.split(":");
			value = parseInt(value[0], 10) + (parseInt(value[1], 10) / 60);
			return value;
		};
		var makeCell = function (index, set) {
			set = typeof set === "object" ? set : {text: set};
			set.format = document.querySelectorAll("th")[index].getAttribute("data-format");
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
		for (var date = start; date <= end; ++date) {
			var row = document.createElement("tr");
			var rowData = (data[date - 1] || "").split("\t");
			var ts = new Date(year, month - 1, date);
			//row.setAttribute("data-day", ts.toGMTString().slice(0, 3).toUpperCase());
			if (ts.getDay() % 6 && "Feiertag" !== rowData[COL_COMMENT]) {
				workDays++;
				row.setAttribute("data-work", "YES");
			} else {
				row.setAttribute("data-work", "NO");
			}
			var worked = parseTime(rowData[COL_WORK_TO]) - parseTime(rowData[COL_WORK_FROM]) - (parseTime(rowData[COL_BREAK_TO]) - parseTime(rowData[COL_BREAK_FROM]));
			workedTotal += worked;
			row.appendChild(makeCell(0, date));
			row.appendChild(makeCell(1, rowData[COL_WORK_FROM]));
			row.appendChild(makeCell(2, rowData[COL_WORK_TO]));
			row.appendChild(makeCell(3, {text: rowData[COL_BREAK_FROM], className: "lunch-break"}));
			row.appendChild(makeCell(4, {text: rowData[COL_BREAK_TO], className: "lunch-break"}));
			row.appendChild(makeCell(5, pretty(worked)));
			row.appendChild(makeCell(6));
			row.appendChild(makeCell(7, {text: rowData[COL_COMMENT], className: "comment"}));
			document.querySelector("tbody").appendChild(row);
		}
		document.querySelector("[data-field=total]").textContent = pretty(workedTotal);
		document.querySelector("[data-field=days]").textContent = workDays;
		document.querySelector("[data-field=hours]").textContent = pretty(workDays * HOURS_PER_DAY, 1);
	});
}(window, document));
