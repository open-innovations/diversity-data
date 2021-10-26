(function(root){

	var OI = root.OI || {};
	if(!OI.ready){
		OI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

	function Builder(el){

		this.ready = false;
		this.data = {'data':[]};
		this.selectedRow = null;
		var hamburger = document.getElementById('showmenu');
		this.buttons = {};

		this.sections = document.querySelectorAll('section');
		this.menu = document.getElementById('menu').querySelectorAll('li a');
		// Highlight the current section in the menu
		addEvent('scroll',[window],{this:this},function(e){ this.scroll(); });

		// Hamburger menu open/close
		addEvent('click',hamburger,{},function(e){
			if(!hamburger.checked) hamburger.blur();
		});
		
		// Load CSV button
		this.buttons.load = document.querySelector('#standard_files-button');
		addEvent('click',this.buttons.load,{this:this},function(e){ e.preventDefault(); this.message(); document.querySelector('#standard_files').click(); hamburger.click(); });
		addEvent('change',document.getElementById('standard_files'),{this:this},function(e){ return this.handleFileSelect(e,'csv'); });

		// Save CSV button
		this.buttons.save = document.getElementById('btn-save');
		addEvent('click',this.buttons.save,{this:this},function(e){ this.save(); hamburger.click(); });



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
			this.fields.push({'id':id,'pattern':pattern,'min':min,'max':max,'type':typ,'el':inps[i],'required':(inps[i].getAttribute('required')=="required")});
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
		
		this.buttons.el = document.createElement('div');
		this.buttons.el.setAttribute('id','buttons');

		this.buttons.add = document.createElement('button');
		this.buttons.add.classList.add('button');
		this.buttons.add.innerHTML = "Add as new row";
		this.buttons.add.setAttribute('type','submit');
		addEvent('click',this.buttons.add,{this:this},function(e){ this.addRow();});
		this.buttons.el.appendChild(this.buttons.add);

		this.buttons.update = document.createElement('button');
		this.buttons.update.classList.add('button');
		this.buttons.update.innerHTML = "Update row";
		addEvent('click',this.buttons.update,{this:this},function(e){ this.updateRow(); });
		this.buttons.el.appendChild(this.buttons.update);

		this.buttons.remove = document.createElement('button');
		this.buttons.remove.classList.add('button');
		this.buttons.remove.innerHTML = "Delete row";
		addEvent('click',this.buttons.remove,{this:this},function(e){ this.removeRow(); });
		this.buttons.el.appendChild(this.buttons.remove);

		this.buttons.clear = document.createElement('button');
		this.buttons.clear.classList.add('b2-bg');
		this.buttons.clear.innerHTML = "Clear form";
		this.buttons.clear.setAttribute('type','reset');
		this.buttons.el.appendChild(this.buttons.clear);

		this.preview = document.getElementById('preview');
		this.preview_orig = this.preview.innerHTML;

		this.toggleButtons();

		p = document.querySelector('#builder > div:last-child');
		p.insertBefore(this.buttons.el, p.firstChild);
		
		addEvent('submit',document.querySelectorAll('form'),{},function(e){
			e.preventDefault();
			e.stopPropagation();
		});

		this.drawTable();

		return this;
	};
	Builder.prototype.scroll = function(){
		var ok,i,s;
		var ok = -1;
		for(s = 0; s < this.sections.length; s++){
			if(this.sections[s].offsetTop <= window.scrollY + this.buttons.el.offsetHeight + parseInt(window.getComputedStyle(this.buttons.el).top) + 5) ok = s;
		}
		// Remove any previous selection
		for(i = 0; i < this.menu.length; i++) this.menu[i].classList.remove('selected');
		// Select this menu item
		if(ok >= 0) this.menu[ok].classList.add('selected');
		return this;
	};
	Builder.prototype.updateOffset = function(){
		var y = (this.buttons.el.offsetHeight + parseInt(window.getComputedStyle(this.buttons.el).top));
		for(var i = 0; i < this.sections.length; i++) this.sections[i].style['scroll-margin-top'] = y+'px';
		return this;
	};
	Builder.prototype.loaded = function(d){
		var r,c,table;
		this.data = CSVToArray(d);
		this.drawTable();

		return this;
	};
	Builder.prototype.clearTable = function(){
		this.preview.innerHTML = this.preview_orig;
		return this;
	};
	Builder.prototype.drawTable = function(replace){
		var i,r,table,row,added,valid,validcell;
		this.rows = [];
		this.csv = "";
		this.validation = [];
		added = 0;

		// Which fields do we actually have data for?
		// First reset the counters
		for(i = 0; i < this.fields.length; i++){
			this.fields[i].count = 0;
		}
		// Loop over the data and count each key
		for(r = 0; r < this.data.data.length; r++){
			for(key in this.data.data[r]){
				if(this.data.data[r][key]!=""){
					this.fields[this.lookup[key]].count++;
				}
			}
		}

		// Create a table
		table = document.createElement('table');
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
				validcell = true;
				if(this.fields[i].count > 0){
					v = (this.data.data[r][this.fields[i].id]||"");
					if(v!="" && this.fields[i].pattern){
						// Check if it validates
						regex = new RegExp(this.fields[i].pattern);
						if(!this.data.data[r][this.fields[i].id].match(regex)){
							validcell = false;
							this.validation.push({'row':r,'col':i,'message':'The value of <code>'+this.data.data[r][this.fields[i].id]+'</code> for <code>'+this.fields[i].id+'</code> on line '+(r+1)+' appears to be invalid. '+this.fields[i].el.closest('.row').querySelector('.pattern').innerHTML});
						}
					}
					row.innerHTML += '<td'+(validcell ? '':' class="invalid"')+'>'+v+'</td>';	// contenteditable="true"
					csvrow += (csvrow ? ',':'')+(v.indexOf(",") >= 0 ? '"':'')+v+(v.indexOf(",") >= 0 ? '"':'');
				}
				if(this.fields[i].required && this.data.data[r][this.fields[i].id]==""){
					valid = false;
					this.validation.push({'row':r,'message':'The required field <code>'+this.fields[i].id+'</code> appears to be missing on line '+(r+1)+'.'});
				}
			}
			if(!valid) row.classList.add('invalid');
			this.csv += csvrow+'\n';
			// Add a click event to the row
			addEvent('click',row,{this:this,r:r},function(e){ this.loadRow(e.data.r); });
			this.rows.push(row);
			table.appendChild(row);
			if(csvrow) added++;
		}
		// If we are replacing the table we temporarily set the height of the container
		if(replace) this.preview.style.height = this.preview.offsetHeight+'px';
		this.preview.innerHTML = (added > 0 ? "" : this.preview_orig);
		this.preview.appendChild(table);
		// If we are replacing the table we unset the height of the container
		if(replace) this.preview.style.height = '';
		
		this.updateOffset();
		
		this.validate();
		
		return this;
	};
	Builder.prototype.validate = function(){
		var err = this.validation.length;
		var html = '';
		for(i = 0; i < err; i++){
			html += '<li>'+this.validation[i].message+'</li>';
			console.error(this.validation[i].message);
		}
		if(html) html = '<h3>'+(err > 0 ? err+' error'+(err==1 ? '':'s') : '')+':</h3><ul>'+html+'</ul>';
		var error = document.getElementById('errors');
		if(!error){
			error = document.createElement('div');
			error.id = 'errors';
			error.classList.add('ERROR','padded');
			document.getElementById('preview').insertAdjacentElement('afterend', error);
		}
		if(error){
			error.style.display = (err == 0) ? 'none':'';
			error.innerHTML = html;
		}
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
		var valid = true;
		for(i = 0; i < this.fields.length; i++){
			if(this.fields[i].el.getAttribute('required')){
				if(this.fields[i].el.value===""){
					valid = false;
				}
			}
		}
		if(valid){
			for(i = 0; i < this.fields.length; i++){
				if(this.fields[i].el.value!=""){
					row[this.fields[i].id] = this.fields[i].el.value;
					added++;
				}
			}
			if(added > 0) this.data.data.push(row);
			this.message();
		}else{
			this.message('ERROR','Unable to add row as there are required fields missing');
		}
		this.drawTable(true);
		return this;
	};
	Builder.prototype.updateRow = function(){
		if(typeof this.selectedRow!=="number"){
			this.message('WARNING','No row selected to update');
			return this;
		}else{
			this.message();
		}
		var row = this.data.data[this.selectedRow];
		for(i = 0; i < this.fields.length; i++){
			row[this.fields[i].id] = this.fields[i].el.value;
		}
		this.data.data[this.selectedRow] = clone(row);
		this.selectedRow = null;
		this.drawTable(true);
		this.toggleButtons();
		this.clearForm();
		return this;
	};
	Builder.prototype.removeRow = function(){
		if(typeof this.selectedRow!=="number"){
			this.message('WARNING','No row selected to update');
			return this;
		}else{
			this.message();
		}
		this.data.data.splice(this.selectedRow,1);
		this.selectedRow = null;
		this.drawTable(true);
		this.toggleButtons();
		this.clearForm();
		return this;
	};
	Builder.prototype.message = function(typ,msg){
		var el = document.getElementById('message');
		el.classList.remove('ERROR','WARNING','INFO','padded');
		if(msg){
			txt = msg.replace(/<[^\>]*>/,'');
			if(typ=="ERROR") console.error(txt);
			else if(typ=="WARNING") console.warn(txt);
			else if(typ=="INFO") console.info(txt);
			else console.log(txt);
			el.innerHTML = msg;
			el.classList.add(typ);
			if(msg) el.classList.add('padded');
		}else{
			el.innerHTML = "";
		}

		return this;
	}
	Builder.prototype.toggleButtons = function(){
		if(typeof this.selectedRow==="number"){
			enable(this.buttons.update);
			enable(this.buttons.remove);
		}else{
			disable(this.buttons.update);
			disable(this.buttons.remove);
		}
		return this;
	};
	Builder.prototype.handleFileSelect = function(evt,typ){

		evt.stopPropagation();
		evt.preventDefault();

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
				output.innerHTML += (f.name)+ ' - ' + niceSize(f.size);

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
			return this;
		}
		return this;
	};
	Builder.prototype.save = function(){
		
		// Bail out if there is no Blob function
		if(typeof Blob!=="function") return this;

		if(this.data.data.length==0){
			this.message('WARNING','Nothing to save');
			return this;
		}else{
			this.message();
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
//		document.getElementById('drop_zone').classList.remove('loaded');
		var det = document.querySelectorAll('.filedetails');
		for(var i = 0; i < det.length; i++) det[i].parentNode.removeChild(det[i]);
		this.clearTable();
		this.data = {'data':[]};
		delete this.file;
		disable(this.buttons.reset);
		
		return this;
	};
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
	function disable(b){
		b.setAttribute('disabled','disabled');
		b.setAttribute('aria-disabled',true);
		return b;
	}
	function enable(b){
		b.removeAttribute('disabled');
		b.removeAttribute('aria-disabled');
		return b;
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

	OI.ready(function(){
		root.builder = new Builder(document.getElementById('builder'));
	});

	root.OI = OI;
	
})(window || this);
