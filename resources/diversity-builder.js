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

		this.data = {'data':[]};
		this.selectedRow = null;
		var _obj = this;

		// Highlight the current section in the menu
		this.sections = document.querySelectorAll('section');
		menu = document.getElementById('menu').querySelectorAll('li a');
		window.addEventListener('scroll',function(e){
			var ok = -1;
			for(var s = 0; s < _obj.sections.length; s++){
				if(_obj.sections[s].offsetTop <= window.scrollY+_obj.buttons.el.offsetHeight) ok = s;
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
		document.getElementById('standard_files').addEventListener('change', function(evt){
			return _obj.handleFileSelect(evt,'csv');
		}, false);
		document.querySelector('form.chooser').addEventListener('reset',function(e){ _obj.reset(); });

		this.ready = false;

		// Process the builder form to find fields and properties
		var inps = document.querySelectorAll('#builder input');
		this.fields = [];
		this.lookup = {};
		for(var i = 0; i < inps.length; i++){
			id = inps[i].getAttribute('id');
			pattern = inps[i].getAttribute('pattern');
			typ = inps[i].getAttribute('type');
			min = inps[i].getAttribute('min');
			max = inps[i].getAttribute('max');
			this.fields.push({'id':id,'pattern':pattern,'min':min,'max':max,'type':typ,'el':inps[i]});
			this.lookup[id] = i;
			// Add validation events
			if(inps[i].getAttribute('pattern')){
				inps[i].addEventListener('input',function(e){
					e.target.setCustomValidity('');
					e.target.checkValidity();
				});
				inps[i].addEventListener('invalid',function(e){
					e.target.setCustomValidity(e.target.parentNode.parentNode.querySelector('.pattern').innerHTML);
				});
			}
		}
		
		this.buttons = {
			'el':document.createElement('div'),
			'add':document.createElement('button'),
			'update':document.createElement('button'),
			'remove':document.createElement('button'),
			'save':document.createElement('button'),
			'reset':document.createElement('button')
		};
		this.buttons.el.setAttribute('id','buttons');
		this.buttons.add.classList.add('button');
		this.buttons.add.innerHTML = "&plus; Add as new row";
		this.buttons.add.setAttribute('type','submit');
		this.buttons.update.classList.add('button');
		this.buttons.update.innerHTML = "Update row";
		this.buttons.update.style.display = 'none';
		this.buttons.remove.classList.add('button');
		this.buttons.remove.innerHTML = "Delete row";
		this.buttons.remove.style.display = 'none';
		this.buttons.save.classList.add('button');
		this.buttons.save.innerHTML = "Save file";
		this.buttons.reset.classList.add('b2-bg');
		this.buttons.reset.innerHTML = "Clear form";
		this.buttons.reset.setAttribute('type','reset');
	
		this.buttons.el.appendChild(this.buttons.add);
		this.buttons.el.appendChild(this.buttons.update);
		this.buttons.el.appendChild(this.buttons.remove);
		this.buttons.el.appendChild(this.buttons.save);
		this.buttons.el.appendChild(this.buttons.reset);

		p = document.querySelector('#builder > div:last-child');
		p.insertBefore(this.buttons.el, p.firstChild);
		
		addEvent('submit',document.querySelectorAll('form'),{},function(e){
			e.preventDefault();
			e.stopPropagation();
		});
		// Add event to the add button
		addEvent('click',this.buttons.add,{this:this},function(e){ this.addRow();});
		// Add event to the update button
		addEvent('click',this.buttons.update,{this:this},function(e){ this.updateRow(); });
		// Add event to the remove button
		addEvent('click',this.buttons.remove,{this:this},function(e){ this.removeRow(); });
		// Add event to the remove button
		addEvent('click',this.buttons.save,{this:this},function(e){ this.save(); });

		this.drawTable();

		return this;
	}
	Builder.prototype.updateOffset = function(){
		for(i = 0; i < this.sections.length; i++){
			this.sections[i].style['scroll-margin-top'] = this.buttons.el.offsetHeight+'px';
		}

		return this;
	};
	Builder.prototype.loaded = function(d){
		var r,c,table;
		this.data = CSVToArray(d);
		this.drawTable();

		return this;
	};
	Builder.prototype.clearTable = function(){
		document.getElementById('preview').innerHTML = "";
		return this;
	};
	Builder.prototype.drawTable = function(replace){
		this.rows = [];
		this.csv = "";

		// Which fields do we actually have data for?
		// First reset the counters
		for(i = 0; i < this.fields.length; i++) this.fields[i].count = 0;
		// Loop over the data and count each key
		for(r = 0; r < this.data.data.length; r++){
			for(key in this.data.data[r]){
				this.fields[this.lookup[key]].count++;
			}
		}

		// Create a table
		var table = document.createElement('table');
		row = document.createElement('tr');

		for(i = 0; i < this.fields.length; i++){
			if(this.fields[i].count > 0){
				row.innerHTML += '<th>'+this.fields[i].id+'</th>';	// contenteditable="true"
				this.csv += (this.csv ? ',':'')+(this.fields[i].id.indexOf(",") >= 0 ? '"':'')+this.fields[i].id+(this.fields[i].id.indexOf(",") >= 0 ? '"':'');
			}
		}
		this.csv += '\n';
		table.appendChild(row);

		for(r = 0; r < this.data.data.length; r++){
			valid = true;
			row = document.createElement('tr');
			csvrow = "";
			for(i = 0; i < this.fields.length; i++){
				if(this.fields[i].count > 0){
					v = (this.data.data[r][this.fields[i].id]||"");
					row.innerHTML += '<td>'+v+'</td>';	// contenteditable="true"
					csvrow += (csvrow ? ',':'')+(v.indexOf(",") >= 0 ? '"':'')+v+(v.indexOf(",") >= 0 ? '"':'');
				}
				if(this.fields[i].el.getAttribute('required') && !this.data.data[r][this.fields[i].id]) valid = false;
			}
			if(!valid) row.classList.add('invalid');
			this.csv += csvrow+'\n';
			// Add a click event to the row
			addEvent('click',row,{this:this,r:r},function(e){ this.loadRow(e.data.r); });
			this.rows.push(row);
			table.appendChild(row);
		}
		preview = document.getElementById('preview');
		// If we are replacing the table we temporarily set the height of the container
		if(replace) preview.style.height = preview.offsetHeight+'px';
		preview.innerHTML = "";
		preview.appendChild(table);
		// If we are replacing the table we unset the height of the container
		if(replace) preview.style.height = '';

		
		this.updateOffset();

		return this;
	};
	Builder.prototype.clearForm = function(){
		for(i = 0; i < this.fields.length; i++){
			this.fields[i].el.value = "";
		}
		return this;
	};
	Builder.prototype.loadRow = function(r){
		var sel,c,el;

		sel = document.querySelector('#preview .selected');
		if(sel) sel.classList.remove('selected');


		if(this.selectedRow==r){
			this.selectedRow = null;
			this.clearForm();
		}else{
			this.selectedRow = r;

			this.rows[r].classList.add('selected');

			for(i = 0; i < this.fields.length; i++){
				key = this.fields[i].id;
				el = document.getElementById(key);
				if(el){
					el.value = (this.data.data[r][key]||"");
				}else{
					console.warn('No input element for '+key);
				}
			}
		}
		// Hide/show the update button
		this.toggleButtons();

		return this;
	};
	Builder.prototype.addRow = function(){
		var row = {};
		var added = 0;
		for(i = 0; i < this.fields.length; i++){
			if(this.fields[i].el.value!=""){
				row[this.fields[i].id] = this.fields[i].el.value;
				added++;
			}
		}
		if(added > 0){
			this.data.data.push(row);
			this.drawTable(true);
		}
		return this;
	};
	Builder.prototype.updateRow = function(){
		if(typeof this.selectedRow!=="number"){
			console.error('No row selected to update');
			return this;
		}
		var row = this.data.data[this.selectedRow];
		for(i = 0; i < this.fields.length; i++){
			//console.log(this.fields[i].id,this.fields[i].el.value);
			if(this.fields[i].el.value!="") row[this.fields[i].id] = this.fields[i].el.value;
		}
		this.data.data[this.selectedRow] = row;
		this.selectedRow = null;
		this.drawTable(true);
		this.toggleButtons();
		this.clearForm();
		return this;
	};
	Builder.prototype.removeRow = function(){
		if(typeof this.selectedRow!=="number"){
			console.error('No row selected to update');
			return this;
		}
		this.data.data.splice(this.selectedRow,1);
		this.selectedRow = null;
		this.drawTable(true);
		this.toggleButtons();
		this.clearForm();
		return this;
	};
	Builder.prototype.toggleButtons = function(){
		this.buttons.update.style.display = (typeof this.selectedRow==="number" ? '':'none');
		this.buttons.remove.style.display = (typeof this.selectedRow==="number" ? '':'none');
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
						_obj.loaded(result);
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
	Builder.prototype.save = function(){
		
		// Bail out if there is no Blob function
		if(typeof Blob!=="function") return this;

		if(this.data.data.length==0){
			console.warn('Nothing to save');
			return this;
		}

		var textFileAsBlob = new Blob([this.csv], {type:'text/plain'});
		if(!this.file) this.file = "data.csv";
		var fileNameToSaveAs = this.file.substring(0,this.file.lastIndexOf("."))+".csv";

		function destroyClickedElement(event){ document.body.removeChild(event.target); }

		var dl = document.createElement("a");
		dl.download = fileNameToSaveAs;
		dl.innerHTML = "Download File";
		if(window.webkitURL != null){
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			dl.href = window.webkitURL.createObjectURL(textFileAsBlob);
		}else{
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			dl.href = window.URL.createObjectURL(textFileAsBlob);
			dl.onclick = destroyClickedElement;
			dl.style.display = "none";
			document.body.appendChild(dl);
		}
		dl.click();

		return this;
	}
	Builder.prototype.reset = function(){
		document.getElementById('drop_zone').classList.remove('loaded');
		var det = document.querySelectorAll('.filedetails');
		for(var i = 0; i < det.length; i++) det[i].parentNode.removeChild(det[i]);
		this.clearTable();
		this.data = {'data':[]};
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
	
	function addEvent(ev,el,attr,fn){
		if(el){
			if(el.tagName) el = [el];
			if(typeof fn==="function"){
				for(i = 0; i < el.length; i++){
					el[i].addEventListener(ev,function(e){
						e.data = attr;
						fn.call(attr['this']||this,e);
					});
				}
			}
		}
	}

	ODI.ready(function(){
		root.builder = new Builder(document.getElementById('builder'));
	});

	root.ODI = ODI;
	
})(window || this);
