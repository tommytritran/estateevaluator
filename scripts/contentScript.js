function getFinnKode(url) {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('finnkode');
}

function getViewCount(finnkode) {
    const url = "https://www.finn.no/prisstatistikk/" + finnkode;
    return fetch(url)
        .then(response => response.text()).then(text => {
            const parser = new DOMParser();
            const html = parser.parseFromString(text, 'text/html');
            const viewCountElement = getElementByXpath('/html/body/div[3]/div/div/div/div[2]/div[1]/span', html);
            return getViewCountValue(viewCountElement.innerHTML);
        })
        .catch(error => console.log(error));

}

function getElementByXpath(path, html) {
    return html.evaluate(path, html, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getViewCountValue(elementString) {
    const start = elementString.indexOf(";");
    const end = elementString.indexOf("<");
    return elementString.substring(start + 1, end);
}

function addElementToPage(element, path) {
    const section = getElementByXpath(path, document);
    section.appendChild(element);
}

function createOverviewElement(value, header){
    const parentDiv = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.append(header);
    dt.classList.add("m-0");
    dd.append(value);
    dd.classList.add("font-bold", "m-0")
    parentDiv.appendChild(dt);  
    parentDiv.appendChild(dd);  
    return parentDiv;
}

function getPriceHistory(finnkode) {
    const url = "https://www.finn.no/realestate/ownershiphistory.html?finnkode=" + finnkode;
    return fetch(url)
        .then(response => response.text()).then(text => {
            const parser = new DOMParser();
            const html = parser.parseFromString(text, 'text/html');
            const priceHistoryTable = getElementByXpath('/html/body/main/div[2]/table', html);
            return extractPriceHistoryData(priceHistoryTable);
        })
}

function extractPriceHistoryData(table){
    const rows = table.getElementsByTagName("tr");
    const data = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName("td");
        if(cells.length > 0){
            data.push({
                date: cells[0].innerHTML,
                price: cells[3].innerHTML.replace(/&nbsp;/g, '.')
            });
        }
    }
    return data;

}

function createPriceHistoryTable(data){
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.textAlign = "left";
    table.style.marginTop = "20px";
    const tableHead = document.createElement("thead");
    tableHead.innerHTML = "<tr><th>Dato</th><th>Pris</th></tr>";
    table.appendChild(tableHead);
    if(data.length > 0){
        for (let inx = 0; index < data.length && 3; index++) {
            const tr = document.createElement("tr");
            const date = document.createElement("td");
            const price = document.createElement("td");
            date.append(data[index].date);
            price.append(data[index].price);
            tr.appendChild(date);
            tr.appendChild(price);
            table.appendChild(tr);
        }
        return table;
    }
    return table;
}

async function init(){
    const url = window.location.href;
    const finnKode = getFinnKode(url);
    
    const viewCount = await getViewCount(finnKode);
    const viewCountElement = createOverviewElement(viewCount, "Visninger");
    addElementToPage(viewCountElement, "/html/body/main/div[3]/section/div[1]/div[1]/section[2]/dl");
    
    const priceHistoryList = await getPriceHistory(finnKode);
    const priceHistoryTable = createPriceHistoryTable(priceHistoryList);
    const section = getElementByXpath("/html/body/main/div[3]/section/div[1]/div[1]/section[2]", document);
    const referenceNode = section.children[1];
    referenceNode.parentNode.insertBefore(priceHistoryTable, referenceNode.nextSibling);

}

init();