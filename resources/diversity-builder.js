(function(root){

	var ODI = root.ODI || {};
	if(!ODI.ready){
		ODI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}
	function AJAX(url,opt){
		// Version 1.3
		if(!opt) opt = {};
		var req = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
		var responseTypeAware = 'responseType' in req;
		req.open((opt.method||'GET'),url+(typeof opt.cache===null || (typeof opt.cache==="boolean" && !opt.cache) ? '?'+Math.random() : ''),true);
		if(responseTypeAware && opt.dataType!=="undefined"){
			try{
				req.responseType = opt.dataType;
			}catch(err){
				console.error('Problem setting response type',err);
			}
		}
		req.onload = function(e){
			if(this.status >= 200 && this.status < 400) {
				// Success!
				var resp = this.response;
				if(typeof opt.success==="function") opt.success.call((opt['this']||this),resp,{'url':url,'data':opt,'originalEvent':e});
			}else{
				// We reached our target server, but it returned an error
				if(typeof opt.error==="function") opt.error.call((opt['this']||this),e,{'url':url,'data':opt});
			}
		};
		if(typeof opt.error==="function"){
			// There was a connection error of some sort
			req.onerror = function(err){ opt.error.call((opt['this']||this),err,{'url':url,'data':opt}); };
		}
		req.send();
		return this;
	}
	if(!ODI.ajax) ODI.ajax = AJAX;

	function Builder(el){

		inps = el.querySelectorAll('input[type=text]');
		
		for(i = 0; i < inps.length; i++){
			if(inps[i].getAttribute('pattern')){
				inps[i].addEventListener('input',function(e){
					e.target.setCustomValidity('');
					e.target.checkValidity();
				});
				inps[i].addEventListener('invalid',function(e){
					e.target.setCustomValidity(e.target.parentNode.querySelector('.pattern').innerHTML);
				});
			}
		}
		sections = document.querySelectorAll('section');
		menu = document.getElementById('menu').querySelectorAll('li a');
		window.addEventListener('scroll',function(e){
			var ok = -1;
			for(var s = 0; s < sections.length; s++){
				if(sections[s].offsetTop <= window.scrollY+5) ok = s;
			}
			// Remove any previous selection
			for(var i = 0; i < menu.length; i++){
				menu[i].classList.remove('selected');
			}
			if(ok >= 0){
				// Select this menu item
				menu[ok].classList.add('selected');
			}
		});
		
		
		// Setup the dnd listeners.
		var dropZone = document.getElementById('drop_zone');
		dropZone.addEventListener('dragover', dropOver, false);
		dropZone.addEventListener('dragout', dragOff, false);
		var _obj = this;
		document.getElementById('standard_files').addEventListener('change', function(evt){
			//document.getElementById('drop_zone).querySelectorAll('
			//S('#drop_zone .helpertext').css({'display':'none'});
			return _obj.handleFileSelect(evt,'csv');
		}, false);
		document.querySelector('form.chooser').addEventListener('reset',function(e){ _obj.reset(); });

		return this;
	}
	Builder.prototype.load = function(){
		var r,c,table;
		this.data = CSVToArray(this.csv);
		console.log('load',this);
		var table = '<table>';
		for(r = 0; r < this.data.rows.length; r++){
			table += '<tr>';
			for(c = 0; c < this.data.rows[r].length; c++){
				table += (r==0 ? '<th>':'<td>')+this.data.rows[r][c]+(r==0 ? '</th>':'</td>');	// contenteditable="true"
			}
			table += '</tr>';
		}
		table += '</table>';
		document.querySelector('#preview').innerHTML = table;
		
		return this;
	};
	Builder.prototype.handleFileSelect = function(evt,typ){

		evt.stopPropagation();
		evt.preventDefault();
		dragOff();

		var files;
		if(evt.dataTransfer && evt.dataTransfer.files) files = evt.dataTransfer.files; // FileList object.
		if(!files && evt.target && evt.target.files) files = evt.target.files;

		var _obj = this;
		if(typ == "csv"){

			// files is a FileList of File objects. List some properties.
			var output = document.createElement('div');
			output.classList.add("filedetails");
			for (var i = 0, f; i < files.length; i++) {
				f = files[i];

				this.file = f.name;
				// ('+ (f.type || 'n/a')+ ')
				output.innerHTML += (f.name)+ ' - ' + niceSize(f.size);

				// DEPRECATED as not reliable // Only process csv files.
				//if(!f.type.match('text/csv')) continue;

				var start = 0;
				var stop = f.size - 1; //Math.min(100000, f.size - 1);

				var reader = new FileReader();

				// Closure to capture the file information.
				reader.onloadend = function(evt) {
					if(evt.target.readyState == FileReader.DONE) { // DONE == 2
						if(stop > f.size - 1){
							var l = evt.target.result.regexLastIndexOf(/[\n\r]/);
							result = (l > 0) ? evt.target.result.slice(0,l) : evt.target.result;
						}else result = evt.target.result;
						_obj.csv = result;
						_obj.load();
					}
				};
				
				// Read in the image file as a data URL.
				//reader.readAsText(f);
				var blob = f.slice(start,stop+1);
				reader.readAsText(blob);
			}
			//document.getElementById('list').innerHTML = '<p>File loaded:</p><ul>' + output.join('') + '</ul>';
			document.getElementById('drop_zone').appendChild(output)
			document.getElementById('drop_zone').classList.add('loaded');
			document.querySelector('form.chooser input[type=file]').blur();
			return this;
		}
		return this;
	};
	Builder.prototype.reset = function(){
		document.getElementById('drop_zone').classList.remove('loaded');
		var det = document.querySelectorAll('.filedetails');
		for(var i = 0; i < det.length; i++) det[i].parentNode.removeChild(det[i]);
		document.getElementById('preview').innerHTML = "";
		delete this.csv;
		delete this.file;
		
		return this;
	};
	function dropOver(evt){
		evt.stopPropagation();
		evt.preventDefault();
		console.log('dropOver',this);
		this.classList.add('drop');
	}
	function dragOff(){
		el = document.querySelectorAll('.drop');
		for(i = 0; i < el.length; i++) el[i].classList.remove('drop');
	}
	function niceSize(b){
		if(b > 1e12) return (b/1e12).toFixed(2)+" TB";
		if(b > 1e9) return (b/1e9).toFixed(2)+" GB";
		if(b > 1e6) return (b/1e6).toFixed(2)+" MB";
		if(b > 1e3) return (b/1e3).toFixed(2)+" kB";
		return (b)+" bytes";
	}
	// Function to clone a hash otherwise we end up using the same one
	function clone(hash) {
		var json = JSON.stringify(hash);
		var object = JSON.parse(json);
		return object;
	}
	/**
	 * CSVToArray parses any String of Data including '\r' '\n' characters,
	 * and returns an array with the rows of data.
	 * @param {String} CSV_string - the CSV string you need to parse
	 * @param {String} delimiter - the delimeter used to separate fields of data
	 * @returns {Array} rows - rows of CSV where first row are column headers
	 */
	function CSVToArray (CSV_string, delimiter) {
		delimiter = (delimiter || ","); // user-supplied delimeter or default comma
		if(CSV_string) CSV_string = CSV_string.replace(/[\n\r]*$/g,"");
		var pattern = new RegExp( // regular expression to parse the CSV values.
			( // Delimiters:
				"(\\" + delimiter + "|\\r?\\n|\\r|^)" +
				// Quoted fields.
				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
				// Standard fields.
				"([^\"\\" + delimiter + "\\r\\n]*))"
			), "gi"
		);
		var r,c,row,rows,matches,data;
		rows = [[]];  // array to hold our data. First row is column headers.
		// array to hold our individual pattern matching groups:
		matches = false; // false if we don't find any matches
		// Loop until we no longer find a regular expression match
		while (matches = pattern.exec( CSV_string )) {
			var matched_delimiter = matches[1]; // Get the matched delimiter
			// Check if the delimiter has a length (and is not the start of string)
			// and if it matches field delimiter. If not, it is a row delimiter.
			if (matched_delimiter.length && matched_delimiter !== delimiter) {
				// Since this is a new row of data, add an empty row to the array.
				rows.push( [] );
			}
			var matched_value;
			// Once we have eliminated the delimiter, check to see
			// what kind of value was captured (quoted or unquoted):
			if (matches[2]) { // found quoted value. unescape any double quotes.
				matched_value = matches[2].replace(
					new RegExp( "\"\"", "g" ), "\""
				);
			}else{ // found a non-quoted value
				matched_value = matches[3];
			}
			// Now that we have our value string, let's add
			// it to the data array.
			rows[rows.length - 1].push(matched_value);
		}
		data = [];
		for(r = 1; r < rows.length; r++){
			row = r-1;
			data[row] = {};
			for(c = 0; c < rows[0].length; c++){
				data[row][rows[0][c]] = rows[r][c];
			}
		}
		return {'rows':rows,'data':data}; // Return the parsed data Array
	}

	ODI.ready(function(){
		root.builder = new Builder(document.getElementById('builder'));
	});

	root.ODI = ODI;
	
})(window || this);
