(function(root){

	if(!root.ODI) root.ODI = {};

	if(!root.ODI.ajax){
		function AJAX(url,opt){
			if(!opt) opt = {};
			var req = new XMLHttpRequest();
			var responseTypeAware = 'responseType' in req;
			if(responseTypeAware && opt.dataType) req.responseType = opt.dataType;
			req.open((opt.method||'GET'),url+(opt.cache ? '?'+Math.random() : ''),true);
			req.onload = function(e){
				if(this.status >= 200 && this.status < 400) {
					// Success!
					var resp = this.response;
					if(typeof opt.success==="function") opt.success.call((opt['this']||this),resp,{'data':opt,'originalEvent':e});
				}else{
					// We reached our target server, but it returned an error
					if(typeof opt.error==="function") opt.error.call((opt['this']||this),e);
				}
			};
			if(typeof opt.error==="function"){
				// There was a connection error of some sort
				req.onerror = function(err){ opt.error.call((opt['this']||this),err); };
			}
			req.send();
			return this;
		}
		ODI.ajax = AJAX;
	}

	root.ODI.ready = function(f){
		if(/in/.test(document.readyState)) setTimeout('ODI.ready('+f+')',9);
		else f();
	};


	ODI.ready(function(){

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

			var rows = [[]];  // array to hold our data. First row is column headers.
			// array to hold our individual pattern matching groups:
			var matches = false; // false if we don't find any matches
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
				} else { // found a non-quoted value
					matched_value = matches[3];
				}
				// Now that we have our value string, let's add
				// it to the data array.
				rows[rows.length - 1].push(matched_value);
			}
			var data = [];
			var r,c,row;
			for(var r = 1; r < rows.length; r++){
				row = r-1;
				data[row] = {};
				for(c = 0; c < rows[0].length; c++){
					data[row][rows[0][c]] = rows[r][c];
				}
			}
			return {'rows':rows,'data':data}; // Return the parsed data Array
		}

		function Dashboard(){
			
			this.el = document.getElementById('dashboard');
			this.data = {};

			this.init = function(){
				
				ODI.ajax("leeds.csv",{
					"this": this,
					"dataType": "text",
					"success": function(d){
						var d = CSVToArray(d);
						this.index = d.data;
						var urls = {};
						var toload = 0;
						var loaded = 0;
						for(var i = 0; i < d.data.length; i++){
							if(d.data[i].URL && !urls[d.data[i].URL]){
								toload++;
								urls[d.data[i].URL] = true;
							}
						}
						// Load each URL
						for(var u in urls){
							this.data[u] = {};
							ODI.ajax(u,{
								"this": this,
								"dataType": "text",
								"url": u,
								"success": function(d,attr){
									// Store the data
									this.data[attr.data.url] = CSVToArray(d).data;
									// Increment the loaded counter
									loaded++;
									// If we've loaded them all we finish up
									if(toload == loaded) this.update();
								}
							});
						}
					}
					
				});

				return this;
			}
			
			this.update = function(){

				var orgs = {};
				for(var i = 0; i < this.index.length; i++){
					d = this.index[i];
					org = (d.organisation);
					div = (d.organisation_division||"_default");
					console.log(i,org,div)
					if(!orgs[org]) orgs[org] = {};
					if(!orgs[org][div]) orgs[org][div] = {};
					console.log(orgs)
					for(var r = 0; r < this.data[d.URL].length; r++){
						if(this.data[d.URL][r].organisation == org){
							if(!d.organisation_division || this.data[d.URL][r].organisation_division==div){
								orgs[org][div][this.data[d.URL][r].published] = this.data[d.URL][r];
							}
						}
					}
										
				}

				var yy = 2020;
				var employees = 0;
				var n = 0;
				var m,o,d,dt;
				for(o in orgs){
					for(d in orgs[o]){
						m = "";
						n++;
						for(dt in orgs[o][d]){
							if(dt.substr(0,4)==yy) if(dt > m) m = dt;
						}
						if(orgs[o][d][m].employees) employees += parseInt(orgs[o][d][m].employees);
					}
				}
				this.el.querySelector('#employees .number').innerHTML = employees;
				this.el.querySelector('#organisations .number').innerHTML = n;
			}

			return this.init();
		}
		
		var dash = new Dashboard();

	});
	
})(window || this);
