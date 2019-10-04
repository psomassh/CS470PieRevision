/*  Haley Psomas-Sheridan
    CS470, Fall 2019
    BudgetPieChart.js
 */


const dataStack = []; //layers of data
const titleStack = [];

const colors = ['#6699cc', '#f2777a',  '#ffcc66', '#515151',  '#f99157', '#66cccc','#747369',
    '#99cc99','#a09f93', '#cc99cc', '#d3d0c8', '#d27b53', '#f2f0ec'];

function symbolicConstants() {
    const parameters = {
        height: 1000,
        width: 1000,
        layer1radius: 70,
        layer2radius: 100,
        layer1innerRadius: 50,
        gapBetweenLayers: 15,
        padAngle: 0.003,
        textOffset: 25,
        titleClearance: 40
    };

    parameters['layer1outerRadius'] = parameters['layer1innerRadius'] + parameters['layer1radius'];
    parameters['layer2innerRadius'] = parameters['layer1outerRadius'] + parameters['gapBetweenLayers'];
    parameters['layer2outerRadius'] = parameters['layer2innerRadius'] + parameters['layer2radius'];
    parameters['labelOffset'] =  parameters['layer1outerRadius'] + 5;
    return parameters;
}



function doRollup(data) {
    // Each element of "data" array has values for
    // Budget and FTE. Sum them up individually and
    // return them in an object.
    return data.reduce((sum, item) => {
        sum['Budget'] += +item['Budget'];
        sum['FTE'] += +item['FTE'];
        return sum;
    }, {
        Budget: 0,
        FTE: 0
    });
}

function propagateBudgetAndFET(data) {
    // calculates Budget and FTE at each of the nested levels.

    if( ! data[0]['values']) // Are we at a leaf node?
        return;

    data.forEach(items => {
        // For each non-leaf nested level, calculate Budget and FTE
        // for each of the items in 'values'. Then, sum up Budget & FTE
        // of the entries in "values" and store them in the root-node (items)
        propagateBudgetAndFET(items.values);
        const sum = doRollup(items.values);
        items['Budget'] = sum['Budget'];
        items['FTE'] = sum['FTE'];
    });
}


//This draws a single slice
function pieGeneratorForItem(data) {
   // console.log('data in pieGeneratorForItem ', data);
    const eachSchoolPiePieces = d3.pie()
        .sort(null)
        .value(d => d['Budget'])
        .padAngle(0.002)
        .startAngle(data['startAngle'])
        .endAngle(data['endAngle'])(data['data']['values']);


    return eachSchoolPiePieces;
}

//makes the group name to match the key
function makeGroupName(name) {
    //console.log('making groupname for ', name);
    return name.match(/[a-zA-Z]+/g).join("");
}

//MouseClick Handlers
function handleMouseClick2(clickedItem, totalBudget) {
    const {
        padAngle,
        layer2innerRadius,
        layer2outerRadius,
        textOffset,
    }= symbolicConstants();


    if(clickedItem.data.key) {

        const wedgeArc = d3.arc()
            .padAngle(padAngle)
            .innerRadius(layer2innerRadius )
            .outerRadius(layer2outerRadius );


        const layerN = d3.select('.main-g')
            .selectAll('.layer1-pie-wedges')
            .filter(d => `.layer1-pie-wedges ${makeGroupName(d.data.key)}` == `.layer1-pie-wedges ${makeGroupName(clickedItem.data.key)}`)
            .selectAll('layer2-pie-wedges')
            .data(pieGeneratorForItem(clickedItem))
            .enter()
            .append('g')
            .attr('test', (d, i) => {  // Add a color and order to each inner wedge.
                d['color'] = colors[i % colors.length];
                d['order'] = i;
            })
            .attr('fill', (d,i) => colors[i])
            .attr('class', d=>`layer2-pie-wedges ${makeGroupName(d.data.key)}`)
            .each(d => d['angle'] = (d['startAngle'] + d['endAngle']) / 2.0);
        //const colors = d3.quantize(d3.interpolateHcl("#f4e153", "#362142"), pie.length);


        layerN
           .append('path')
            .transition()
            //.attr('test', d => console.log("this is d in wedge", d))
            .duration((d, i, p) => p.length * 50)
            .delay((d, i) => i * 50)
            .attr('d', d => wedgeArc(d))
            .attr('fill', (d, i, p) => {  // generate variations of the layer 1 color for its on level 2.
                let {l, c, h} = d3.lch(colors[d['order']]);
                c += (i < p.length) ? -2 * i : 2 * i;
                return d3.lch(l - 2 * (i+1), c, h);
            });

        const radius = layer2outerRadius + textOffset;
        const labels = d3.select('.main-g')  //create labels
            .selectAll('.layer2-pie-wedges')
            .append('g')
            //.attr('class', d=> 'labels') //give the labels a class name
            .attr('class', d=>`labels ${makeGroupName(d.data.key)}`)
            .attr('transform', d => `rotate(${180 * d['angle'] / Math.PI - 90}) translate(${radius}, 0)`)


        labels.append('text')
            .text(d => `${d.data.key} (${d3.format(".2f")(d.data.Budget / totalBudget * 100)}% - ${d.data.Budget.toLocaleString()} - ${d.data.FTE.toLocaleString()})`)
            .attr('dy', '0.5em')
            .attr('transform', d => d['angle'] > Math.PI ? 'rotate(180)' : 'rotate(0)')
            .attr('text-anchor', d => d['angle'] > Math.PI ? 'end' : 'begin')
            .attr('fill', 'black')
            .on('click', function(d) {
                const clickedItem = d;


                d3.selectAll('.layer2-pie-wedges').selectAll('.labels')
                    .filter(d => `.labels ${makeGroupName(d.data.key)}` == `.labels ${makeGroupName(clickedItem.data.key)}`)
                    .remove();

                handleMouseClick3(d,totalBudget);
            }); //otherwise it will get the color of the wedge

    }
}

function handleMouseClick3(clickedItem, totalBudget) {
    const {
        padAngle,
        layer2outerRadius,
        textOffset,
    }= symbolicConstants();


    if(clickedItem.data.key) {

        const wedgeArc = d3.arc()
            .padAngle(padAngle)
            .innerRadius(layer2outerRadius + 15)
            .outerRadius(layer2outerRadius + 15 + 100);


        const layerN = d3.select('.main-g')
            .selectAll('.layer2-pie-wedges')
            .filter(d => `layer2-pie-wedges ${makeGroupName(d.data.key)}` == `layer2-pie-wedges ${makeGroupName(clickedItem.data.key)}`)
            .selectAll('layer3-pie-wedges')
            .data(pieGeneratorForItem(clickedItem))
            .enter()
            .append('g')
            .attr('test', (d, i) => {  // Add a color and order to each inner wedge.
                d['color'] = colors[i % colors.length];
                d['order'] = i;
            })
            .attr('fill', (d,i) => colors[i])
            .attr('class', d=>`layer3-pie-wedges ${makeGroupName(d.data.key)}`)
            .each(d => d['angle'] = (d['startAngle'] + d['endAngle']) / 2.0);
        //const colors = d3.quantize(d3.interpolateHcl("#f4e153", "#362142"), pie.length);


        layerN
            .append('path')
            .transition()
            //.attr('test', d => console.log("this is d in wedge", d))
            .duration((d, i, p) => p.length * 50)
            .delay((d, i) => i * 50)
            .attr('d', d => wedgeArc(d))
            .attr('fill', (d, i, p) => {  // generate variations of the layer 1 color for its on level 2.
                let {l, c, h} = d3.lch(colors[d['order']]);
                c += (i < p.length) ? -2 * i : 2 * i;
                return d3.lch(l - 2 * (i+1), c, h);
            });

        const radius = layer2outerRadius + textOffset + 100;
        const labels = d3.select('.main-g')  //create labels
            .selectAll('.layer3-pie-wedges')
            .append('g')
            //.attr('class', d=> 'labels') //give the labels a class name
            .attr('class', d=>`labels ${makeGroupName(d.data.key)}`)
            .attr('transform', d => `rotate(${180 * d['angle'] / Math.PI - 90}) translate(${radius}, 0)`)


        labels.append('text')
            .text(d => `${d.data.key} (${d3.format(".2f")(d.data.Budget / totalBudget * 100)}% - ${d.data.Budget.toLocaleString()} - ${d.data.FTE.toLocaleString()})`)
            .attr('dy', '0.5em')
            .attr('transform', d => d['angle'] > Math.PI ? 'rotate(180)' : 'rotate(0)')
            .attr('text-anchor', d => d['angle'] > Math.PI ? 'end' : 'begin')
            .attr('fill', 'black')
            .on('click', function(d) {
                const clickedItem = d;


                d3.selectAll('.layer3-pie-wedges').selectAll('.labels')
                    .filter(d => `.labels ${makeGroupName(d.data.key)}` == `.labels ${makeGroupName(clickedItem.data.key)}`)
                    .remove();


                handleMouseClick4(d,totalBudget);
            }); //otherwise it will get the color of the wedge

    }
}

function handleMouseClick4(clickedItem, totalBudget) {
    const {
        padAngle,
        layer2outerRadius,
        textOffset,
    }= symbolicConstants();



    if(clickedItem.data.key) {

        const wedgeArc = d3.arc()
            .padAngle(padAngle)
            .innerRadius(layer2outerRadius + 15 + 100)
            .outerRadius(layer2outerRadius + 15 + 200);




        const layerN = d3.select('.main-g')
            .selectAll('.layer3-pie-wedges')
            .filter(d => `layer3-pie-wedges ${makeGroupName(d.data.key)}` == `layer3-pie-wedges ${makeGroupName(clickedItem.data.key)}`)
            //.attr('test', console.log(`layer1-pie-wedges ${clickedItem.data.key}`))
            .selectAll('layer4-pie-wedges')
            .data(pieGeneratorForItem(clickedItem))
            .enter()
            .append('g')
            .attr('test', (d, i) => {  // Add a color and order to each inner wedge.
                d['color'] = colors[i % colors.length];
                d['order'] = i;
            })
            .attr('fill', (d,i) => colors[i])
            .attr('class', d=>`layer4-pie-wedges ${makeGroupName(d.data.key)}`)
            .each(d => d['angle'] = (d['startAngle'] + d['endAngle']) / 2.0);
        //const colors = d3.quantize(d3.interpolateHcl("#f4e153", "#362142"), pie.length);


        layerN
            .append('path')
            .transition()
            .duration((d, i, p) => p.length * 50)
            .delay((d, i) => i * 50)
            .attr('d', d => wedgeArc(d))
            .attr('fill', (d, i, p) => {  // generate variations of the layer 1 color for its on level 2.
                let {l, c, h} = d3.lch(colors[d['order']]);
                c += (i < p.length) ? -2 * i : 2 * i;
                return d3.lch(l - 2 * (i+1), c, h);
            });
        //.attr('fill', (d, i) => colors[i])

        const radius = layer2outerRadius + textOffset + 200;
        const labels = d3.select('.main-g')  //create labels
            .selectAll('.layer4-pie-wedges')
            .append('g')
            .attr('class', d=>`labels ${makeGroupName(d.data.key)}`)
            .attr('transform', d => `rotate(${180 * d['angle'] / Math.PI - 90}) translate(${radius}, 0)`)


        labels.append('text')
            .text(d => `${d.data.key} (${d3.format(".2f")(d.data.Budget / totalBudget * 100)}% - ${d.data.Budget.toLocaleString()} - ${d.data.FTE.toLocaleString()})`)
            .attr('dy', '0.5em')
            .attr('transform', d => d['angle'] > Math.PI ? 'rotate(180)' : 'rotate(0)')
            .attr('text-anchor', d => d['angle'] > Math.PI ? 'end' : 'begin')
            .attr('fill', 'black')
            .on('click', function(d) {
                const clickedItem = d;


                d3.selectAll('.layer4-pie-wedges').selectAll('.labels')
                    .filter(d => `.labels ${makeGroupName(d.data.key)}` == `.labels ${makeGroupName(clickedItem.data.key)}`)
                   // .attr('test', console.log("remove", `labels ${makeGroupName(d.data.key)}`))
                    .remove();

            }); //otherwise it will get the color of the wedge

    }
}



function drawPieChart() {
    const nestedBudgetCategories =  dataStack[dataStack.length -1];

    const { //vars created (all const)
        layer1innerRadius,
        layer1outerRadius,
        labelOffset,
        textOffset
    } = symbolicConstants(); //a way to put all constants to configure the chart in one place (a function)
//the object that comes from symbolicConstants will populate the constants that are created above.

    propagateBudgetAndFET(nestedBudgetCategories);

    var toPlot;
    if(dataStack.length == 1) {
        toPlot = nestedBudgetCategories[0].values;
    }
    else{
        toPlot = nestedBudgetCategories;
    }

    const totalBudget = d3.sum(toPlot, d => d.Budget);

    const budgetArc = d3.arc()
        .innerRadius(layer1innerRadius)
        .outerRadius(layer1outerRadius);


    const pie = d3.pie()
        .sort(null)
        .startAngle(0)
        .endAngle(2 * Math.PI)
        .padAngle(0.002 )
       .value(d => d.Budget)(toPlot);


    const layer1_gs = d3.select('.main-g')
        .selectAll('.layer1-pie-wedges')
        .data(pie)
        .enter()
        .append('g')
        .attr('test', (d, i) => {  // Add a color and order to each inner wedge.
            d['color'] = colors[i % colors.length];
            d['order'] = i;
        })
        .attr('fill', (d,i) => colors[i])
        .attr('class', d=>`layer1-pie-wedges ${makeGroupName(d.data.key)}`);

    //const colors = d3.quantize(d3.interpolateHcl("#f4e153", "#362142"), pie.length);

    layer1_gs
        .append('path')
        .attr('d', budgetArc)
        //.attr('fill', (d, i) => colors[i])
        .on('click', function(d) {
            handleMouseClick(d)
        });


    if(dataStack.length > 1) { //if you've already gone down a layer...
        d3.select('.layer1-pie-wedges ')
            .append('text')
            .text('back')
            .attr('fill', 'black')
            .attr('font-size', '20px')
            .attr('dy', '0.25em')
            .attr('text-anchor', 'middle')
            .on('click', function(d) {
                dataStack.pop();
                titleStack.pop();
                titleStack.pop();
                d3.select(this).remove(); //remove the newest chart
                clearPie();
                drawPieChart(); //draw the value on stack
            });

    }
    pie.forEach(piece => piece['angle'] = (piece['startAngle'] + piece['endAngle']) / 2);


    const radius = labelOffset + textOffset;
    const labels = d3.select('.main-g')  //create labels
        .selectAll('.layer1-pie-wedges')
        .append('g')
        .attr('class', d=>`label ${makeGroupName(d.data.key)}`)
        .attr('transform', d => `rotate(${180 * d['angle'] / Math.PI - 90}) translate(${radius}, 0)`);



    //add labels to pie chart
    labels.append('text')
        .text(d => `${d.data.key} (${d3.format(".2f")(d.data.Budget / totalBudget * 100)}% - ${d.data.Budget.toLocaleString()} - ${d.data.FTE.toLocaleString()})`)
        .attr('dy', '0.5em')
        .attr('transform', d => d['angle'] > Math.PI ? 'rotate(180)' : 'rotate(0)')
        .attr('text-anchor', d => d['angle'] > Math.PI ? 'end' : 'begin')
        .attr('fill', 'black')
        .on('click', function(d) {
            const clickedItem = d;

            d3.selectAll('.label')
                .filter(d => `.label ${makeGroupName(d.data.key)}` == `.label ${makeGroupName(clickedItem.data.key)}`)
                .remove();


            handleMouseClick2(d,totalBudget);
        }); //otherwise it will get the color of the wedge

    addTitle(); //add the title path
}

//remove pie chart
function clearPie() {
    d3.selectAll('.layer1-pie-wedges')
        .remove();

}


function addTitle() {

    const {
        titleClearance
    } = symbolicConstants();


    d3.select('.title-g').select('.title-text').remove();
   // const boundingBoxOfMainGroup = d3.select('.title-g').node().getBBox();

    let titleString = "";
    for(var i = 0; i < titleStack.length ; i++) {
            titleString = titleString  +  titleStack[i];
    }


    d3.select('.title-g')
        .append('text')
        .text(titleString)
        .attr('font-size', '20px')
        .attr('transform', 'translate(0, 20)')
        .attr('class', 'title-text');
}



//click handler for pie chart re-draw
function handleMouseClick(clickedItem) {

    if(clickedItem.data.key) {
        titleStack.push(" > ");
        titleStack.push(clickedItem.data.key);
        dataStack.push(clickedItem.data.values)
        clearPie();
        drawPieChart();
    }
}

function drawChart(csv){
    const nestedBudgetCategories = d3.nest()
        .key(d => d['Account Category'])
        .key(d => d['Division'])
        .key(d => d['Unit'])
        .key(d => d['Department'])
        .key(d => d['Account Detail'])
        .key(d => d['Year'])
        .entries(csv);

    const title = d3.select('#chart')
        .append('svg')
        .attr('width', 1200)
        .attr('height', 50)
        .append('g')
        .attr('class', 'title-g');

    const mainSVG = d3.select('#chart')
        .append('svg')
        .attr('width', 1200)
        .attr('height', 1200)
        .append('g')
        .attr('class', 'main-g')
        .attr('transform', 'translate(600, 600)');


    dataStack.push(nestedBudgetCategories); //when you draw, push info to chart
    titleStack.push('Campus Budget Plan - Expenses'); //initial title

    drawPieChart();

}