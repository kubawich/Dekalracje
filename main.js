var _PDF_DOC,
    _CURRENT_PAGE,
    _TOTAL_PAGES,
    _PAGE_RENDERING_IN_PROGRESS = 0,
    _CANVAS = document.querySelector('#pdf-canvas'),
    _CTX,
    zoomfactorx,
    zoomfactory,
    _COLOR,
    _INFO,
    _CURR_LINE;

// initialize and load the PDF
async function showPDF(pdf_url) {
    document.querySelector("#pdf-loader").style.display = 'block';

    // get handle of pdf document
    try {
        _PDF_DOC = await pdfjsLib.getDocument({ url: pdf_url });
    }
    catch(error) {
        alert(error.message);
    }
    _INFO = await _PDF_DOC.getMetadata();
    // total pages in pdf
    _TOTAL_PAGES = _PDF_DOC.numPages;
    
    // Hide the pdf loader and show pdf container
    document.querySelector("#pdf-loader").style.display = 'none';
    document.querySelector("#pdf-contents").style.display = 'block';
    document.querySelector("#pdf-total-pages").innerHTML = _TOTAL_PAGES;

    // show the first page
    showPage(1);
}

// load and render specific page of the PDF
async function showPage(page_no) {
    _PAGE_RENDERING_IN_PROGRESS = 1;
    _CURRENT_PAGE = page_no;
    // disable Previous & Next buttons while page is being loaded
    document.querySelector("#pdf-next").disabled = true;
    document.querySelector("#pdf-prev").disabled = true;
    document.querySelector("#scalex").disabled = true;
    document.querySelector("#scaley").disabled = true;
    document.querySelector("#color").disabled = true;

    // while page is being rendered hide the canvas and show a loading message
    document.querySelector("#pdf-canvas").style.display = 'none';
    document.querySelector("#page-loader").style.display = 'block';

    // update current page
    document.querySelector("#pdf-current-page").innerHTML = page_no;

    if(_COLOR == undefined) _COLOR = 2.6;
    if(zoomfactorx == undefined) zoomfactorx = 1.015;
    if(zoomfactory == undefined) zoomfactory = 1.015;
    
    // get handle of page
    try {
        var page = await _PDF_DOC.getPage(page_no);
    }
    catch(error) {
        alert(error.message);
    }

    // original width of the pdf page at scale 1
    var pdf_original_width = page.getViewport(1).height;
    
    // as the canvas is of a fixed width we need to adjust the scale of the viewport where page is rendered
    var scale_required = _CANVAS.height / pdf_original_width;

    // get viewport to render the page at required scale
    var viewport = page.getViewport(scale_required) ;

    // set canvas height same as viewport height
    _CANVAS.width = viewport.width;

    // setting page loader height for smooth experience
    document.querySelector("#page-loader").style.height =  _CANVAS.height + 'px';
    document.querySelector("#page-loader").style.lineHeight = _CANVAS.height + 'px';

    // page is rendered on <canvas> element
    var render_context = {
        canvasContext: _CANVAS.getContext('2d'), 
        viewport: viewport
    };
        
    _CTX =  _CANVAS.getContext('2d');

    //_CTX.rotate(45 * Math.PI / 180);
    //zoomfactor = 1.05;
    _CTX.setTransform(zoomfactorx, 0, 0, zoomfactory, -(zoomfactorx - 1) * _CANVAS.width/2, -(zoomfactory - 1) * _CANVAS.height / 2);


    // render the page contents in the canvas
    try {
        await page.render(render_context);
    }
    catch(error) {
        alert(error.message);
    }

    var imgData = _CTX.getImageData(0, 0, _CANVAS.width, _CANVAS.height);
    var d = imgData.data;
    // loop through all pixels
    // each pixel is decomposed in its 4 rgba values
    for (var i = 0; i < d.length; i += 4) {
      // get the medium of the 3 first values ( (r+g+b)/3 )
      var med = (d[i] + d[i + 1] + d[i + 2]) / _COLOR;
      // set it to each value (r = g = b = med)
      d[i] = d[i + 1] = d[i + 2] = med;
      // we don't touch the alpha
    }
    // redraw the new computed image
    _CTX.putImageData(imgData, 0, 0);
    _PAGE_RENDERING_IN_PROGRESS = 0;


    // re-enable Previous & Next buttons
    document.querySelector("#pdf-next").disabled = false;
    document.querySelector("#pdf-prev").disabled = false;
    document.querySelector("#scalex").disabled = false;
    document.querySelector("#scaley").disabled = false;
    document.querySelector("#color").disabled = false;

    // show the canvas and hide the page loader
    document.querySelector("#pdf-canvas").style.display = 'block';
    document.querySelector("#page-loader").style.display = 'none';
}

// Download button (PNG)
$("#download-image").on('click', function() {
	$(this).attr('href', $('#pdf-canvas').get(0).toDataURL());
	console.log(_INFO.info.Title)
    // Specfify download option with name
    $(this).attr('download', 'strona.gif');
    // image = $(this).attr('href', $('#pdf-canvas').get(0).toDataURL("image/png").replace("image/png", "image/octet-stream"));
    // var link = document.createElement('a');
    // link.download = $`{info.info.Title}.gif`;
    // link.href = image;
    // link.click();
});

$("#upload-button").on('click', function() {
	$("#file-to-upload").trigger('click');
});

// When user chooses a PDF file
$("#file-to-upload").on('change', function() {
	// Validate whether PDF
    if(['application/pdf'].indexOf($("#file-to-upload").get(0).files[0].type) == -1) {
        alert('Error : Not a PDF');
        return;
    }

	// Send the object url of the pdf
	showPDF(URL.createObjectURL($("#file-to-upload").get(0).files[0]), '');
});

$("#upload-button-TPL").on('click', function() {
	$("#file-to-upload-TPL").trigger('click');
});

// When user chooses a PDF file
$("#file-to-upload-TPL").on('change', function() {

    var fr = new FileReader(); 
    fr.onload=function(){ 
        document.getElementById('TPLfile').textContent = fr.result; 
        TplInterpret(fr.result);
        selectTextareaLine(document.getElementById('TPLfile'), 1);
        _CURR_LINE = 1;
    } 
      try{
          fr.readAsText(this.files[0]); 
      }catch(error){alert("Nie wybrano pliku")}
});

$("#scalex").on("input change", function() {
    zoomfactorx =  $(this).val()
    $('#slider_valuex').html('X: ' + $(this).val());
    if(_PAGE_RENDERING_IN_PROGRESS == 0)
    showPage(_CURRENT_PAGE);
});

$("#scaley").on("input change", function() {
    zoomfactory =  $(this).val()
    $('#slider_valuey').html('Y: ' + $(this).val());
    if(_PAGE_RENDERING_IN_PROGRESS == 0)
    showPage(_CURRENT_PAGE);
});

$("#color").on("input change", function() {
    _COLOR =  $(this).val()
    $('#color_value').html('Kolor: ' + $(this).val());
    if(_PAGE_RENDERING_IN_PROGRESS == 0)
    showPage(_CURRENT_PAGE);
});

// click on the "Previous" page button
document.querySelector("#pdf-prev").addEventListener('click', function() {
    if(_CURRENT_PAGE != 1)
        showPage(--_CURRENT_PAGE);
});

// click on the "Next" page button
document.querySelector("#pdf-next").addEventListener('click', function() {
    if(_CURRENT_PAGE != _TOTAL_PAGES)
        showPage(++_CURRENT_PAGE);
});


document.querySelector("#line-prev").addEventListener('click', function() {
    selectTextareaLine(document.getElementById('TPLfile'), _CURR_LINE--)
});


document.querySelector("#line-next").addEventListener('click', function() {
    selectTextareaLine(document.getElementById('TPLfile'), _CURR_LINE++)
});

function getMousePosition(event) { 
    let rect = _CANVAS.getBoundingClientRect(); 
    let x = event.clientX - rect.left; 
    let y = event.clientY - rect.top; 
    console.log("Coordinate x: " + x,  
                "Coordinate y: " + y); 
}

let canvasElem = document.querySelector("canvas"); 
  
canvasElem.addEventListener("mousedown", function(e) 
{ 
    getMousePosition( e); 
});



function selectTextareaLine(textArea,lineNum) {
    lineNum--; // array starts at 0
    var lines = textArea.value.split("\n");

    // calculate start/end
    var startPos = 0, endPos = textArea.value.length;
    for(var x = 0; x < lines.length; x++) {
        if(x == lineNum) {
            break;
        }
        startPos += (lines[x].length+1);
    }
    if(lineNum>=0)
    var endPos =  lines[lineNum].length+startPos;

    if(typeof(textArea.selectionStart) != "undefined") {
        textArea.focus();
        textArea.selectionStart = startPos;
        textArea.selectionEnd = endPos;
        return true;
    }
    return false;
}


var objects = new Array();
var pair;
function TplInterpret(tpl_content){
    let linesWhiteSpace = tpl_content.split('\n')
    linesWhiteSpace.splice(0,1);
    var lines = linesWhiteSpace.filter(function(value) {return value.length > 5 })
    lines = lines.map(x=>x.slice(1))
    lines = lines.map(x=>x.split('//')[0])
    lines = lines.map(x=>x.replaceAll(`"`,''))

    lines = lines.map(x=>x.replace(`  `,' '))
    for(i = 0; i < lines.length; i++){
        var temp = lines[i].split(' ')
        var param = temp[0]
        var pos = temp[1]
         pair = {param, pos}
         objects = objects.concat(pair)
    }

    //lines.forEach(x=>console.log(objects))
    console.log(objects)
}