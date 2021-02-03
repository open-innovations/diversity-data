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

		// A non-jQuery dependent function to get a style
		function getStyle(el, styleProp) {
			if (typeof window === 'undefined') return;
			var style;
			if(!el) return style;
			if (el.currentStyle) style = el.currentStyle[styleProp];
			else if (window.getComputedStyle) style = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
			if (style && style.length === 0) style = null;
			return style;
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

		function Card(attr){
			if(!attr) attr = {};
			if(attr.el) this.el = attr.el;
			this.o = this.el.querySelector('.output');
			this.header = this.el.querySelector('header');
			this.addPanels = function(panels){
				var i,c,end,_obj;
				if(!this.nav && panels){
					this.nav = {'el':document.createElement('ul'),'tabs':{}};
					this.panels = {};
					this.nav.el.classList.add('tabs');
					end = this.header;
					if(this.el.querySelector('summary')) end = this.el.querySelector('summary');
					end.insertAdjacentElement('afterend', this.nav.el);
					end = this.nav.el;
					i = 0;
					_obj = this;
					function togglePanels(e){
						id = e.target.getAttribute('data-id');
						_obj.el.querySelectorAll('.open').forEach(function(e){ e.classList.remove('open') });
						for(pid in _obj.panels){
							if(pid==id){
								_obj.nav.tabs[pid].el.classList.add('open');
								_obj.panels[pid].el.classList.add('open');
							}								
						}
					}
					for(id in panels){
						b = document.createElement('li');
						b.innerHTML = '<button>'+panels[id].label+'</button>';
						b.querySelector('button').setAttribute('data-id',id);
						this.nav.tabs[id] = {'el':b};
						this.nav.el.appendChild(b);
						if(i==0) b.classList.add('open');
						// Create an output area
						o = document.createElement('article');
						// Add classes to the output area
						if(panels[id]['class']){
							cls = panels[id]['class'].split(/ /);
							for(c = 0; c < cls.length; c++) o.classList.add(cls[c]);
						}
						if(i==0) o.classList.add('open');
						b.addEventListener('click',togglePanels);
						this.panels[id] = {'el':o};
						// Add it after the header or previously added output areas
						end.insertAdjacentElement('afterend',o);
						end = o;
						i++;
					}
				}
				return this;
			}
			return this;
		}

		function Dashboard(attr){
			
			this.el = document.getElementById('dashboard');
			this.data = {};

			var _obj = this;
			function makeSelect(t,txt,html){
				if(!_obj.selector) _obj.selector = {};
				if(!_obj.selector[t]){
					_obj.selector[t] = { 'lbl': document.createElement('label'), 'el':document.createElement('select'),'holder':document.createElement('div') };
					_obj.selector[t].holder.classList.add('item');
					_obj.selector[t].lbl.setAttribute('for',t);
					_obj.selector[t].lbl.innerHTML = txt;
					_obj.selector[t].el.setAttribute('id',t);
					if(html) _obj.selector[t].el.innerHTML = html;
					// Add change event to <select>
					_obj.selector[t].el.addEventListener('change', function(e){ _obj.update(); });
					// Add the selector to the <nav>
					_obj.selector[t].holder.appendChild(_obj.selector[t].lbl);
					_obj.selector[t].holder.appendChild(_obj.selector[t].el);
					_obj.el.querySelector('.nav').appendChild(_obj.selector[t].holder);
				}
			}

			this.init = function(attr){
				if(!attr) attr = {};
				
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
									var r,o;
									// Store the data
									this.data[attr.data.url] = CSVToArray(d).data;
									// Convert numbers into numbers
									for(r = 0; r < this.data[attr.data.url].length; r++){
										for(o in this.data[attr.data.url][r]){
											v = parseFloat(this.data[attr.data.url][r][o])
											if(typeof v==="number" && v==this.data[attr.data.url][r][o]) this.data[attr.data.url][r][o] = v;
										}
									}
									// Increment the loaded counter
									loaded++;
									// If we've loaded them all we finish up
									if(toload == loaded) this.update();
								}
							});
						}
					}
					
				});

				makeSelect('year','Year:');
				makeSelect('employer','Employer:');
				
				var cards = this.el.querySelectorAll(attr.cards||'.facet');
				this.cards = {};
				for(var i = 0; i < cards.length; i++){
					id = cards[i].getAttribute('id');
					if(id) this.cards[id] = new Card({'el':cards[i]});
				}

				return this;
			}
			
			this.getEmployer = function(){
				var employer = this.selector.employer.el.options[this.selector.employer.el.selectedIndex];
				if(employer) employer = {'org':employer.getAttribute('data-org'),'div':employer.getAttribute('data-div')};
				return employer;				
			}
			
			
			this.update = function(){

				function formatEmployer(o,d){
					return (o ? o+(d && d!="_none" ? ' ('+d+')' : '') : "");
				}
				var orgs = {};
				var orgopts = '<option>Select an employer</option>';
				var employer = this.getEmployer();

				for(var i = 0; i < this.index.length; i++){
					if(!this.index[i].organisation_division) this.index[i].organisation_division = "_none";
					d = this.index[i];
					org = (d.organisation);
					div = (d.organisation_division||"_none");
					if(!orgs[org]) orgs[org] = {};
					if(!orgs[org][div]){
						orgs[org][div] = {};
						orgopts += '<option data-org="'+org+'" data-div="'+div+'"'+(employer && employer.org==org && employer.div==d.organisation_division ? ' selected="selected"' : '')+'>'+formatEmployer(org,d.organisation_division)+'</option>'
					}
					for(var r = 0; r < this.data[d.URL].length; r++){
						if(this.data[d.URL][r].organisation == org){
							if(!this.data[d.URL][r].organisation_division) this.data[d.URL][r].organisation_division = "_none";
							if(this.data[d.URL][r].organisation_division==div){
								if(typeof this.data[d.URL][r].published==="string"){
									orgs[org][div][this.data[d.URL][r].published] = this.data[d.URL][r];
									orgs[org][div][this.data[d.URL][r].published].URL = d.URL;
								}
							}
						}
					}
				}

				// Default to this year
				var yy = (new Date()).getFullYear();
				// If the selector exists, use the selected value
				if(this.selector.year.el && this.selector.year.el.value) yy = this.selector.year.el.value;
				var employees = 0;
				var n = 0;
				var m,o,d,dt;
				var opt="";
				var summary = "";
				var dates = {'min':'3000-01-01','max':'2000-01-01'};
				for(o in orgs){
					for(d in orgs[o]){
						for(dt in orgs[o][d]){
							if(dt){
								if(dt < dates.min) dates.min = dt;
								if(dt > dates.max) dates.max = dt;
							}
						}
					}
				}
				// Update year selector range
				miny = parseInt(dates.min.substr(0,4));
				maxy = parseInt(dates.max.substr(0,4));
				for(y = maxy; y >= miny ; y--) opt += '<option value="'+y+'"'+(y==yy ? ' selected="selected"':'')+'>'+y+'</option>';
				this.selector.year.el.innerHTML = opt;
				this.selector.employer.el.innerHTML = orgopts;
				employer = this.getEmployer();
				// Limit selected year to the range of the data
				yy = Math.max(Math.min(yy,maxy),miny);

				// Keep the latest rows for the selected year
				var keep = [];
				for(o in orgs){
					for(d in orgs[o]){
						m = "";
						for(dt in orgs[o][d]){
							if(dt.substr(0,4)==yy) if(dt > m) m = dt;
							if(dt < dates.min) dates.min = dt;
							if(dt > dates.max) dates.max = dt;
						}
						if(m && orgs[o][d][m].employees) keep.push(JSON.parse(JSON.stringify(orgs[o][d][m])));
					}
				}

				n = 0;
				var ages = {
					"16-24":{"keys":["age_16-24"],"n":{"total":0,"specific":0}},
					"25-34":{"keys":["age_25-34"],"n":{"total":0,"specific":0}},
					"35-44":{"keys":["age_35-44"],"n":{"total":0,"specific":0}},
					"45-54":{"keys":["age_45-54"],"n":{"total":0,"specific":0}},
					"55-64":{"keys":["age_55-64"],"n":{"total":0,"specific":0}},
					"65-69":{"keys":["age_65-69"],"n":{"total":0,"specific":0}},
					"70+":{"keys":["age_70+"],"n":{"total":0,"specific":0}},
					"total":{"keys":["age_total"],"n":{"total":0,"specific":0}},
					"undisclosed":{"keys":["age_undisclosed"],"n":{"total":0,"specific":0}}
				}

				for(i = 0; i < keep.length; i++){
					employees += keep[i].employees;
					dt = new Date(keep[i].published);
					for(a in ages){
						for(k = 0 ; k < ages[a].keys.length; k++){
							ky = ages[a].keys[k];
							if(typeof keep[i][ky]==="number"){
								ages[a].n.total += keep[i][ky];
								if(employer && keep[i].organisation==employer.org && (!keep[i].organisation_division || keep[i].organisation_division==employer.div)) ages[a].n.specific += keep[i][ky];
							}
						}
					}
					summary += '<li><a href="'+keep[i].URL+'">'+formatEmployer(keep[i].organisation,keep[i].organisation_division)+' updated <time datetime="'+keep[i].published+'">'+dt.toLocaleDateString()+'</time></a></li>';
					n++;
				}
				ageout = "";
				age = {
					'series': [{'label':'Leeds','data':[]},{'label':'Employer','data':[]}],
					'labels': []
				}
				for(a in ages){
					totpc = (ages.total.n.total > 0 ? (100*ages[a].n.total/ages.total.n.total) : 0);
					spepc = (ages.total.n.specific > 0 ? 100*(ages[a].n.specific||0)/ages.total.n.specific : 0);
					ageout += '<tr><td>'+a+'</td><td>'+ages[a].n.total+'</td><td>'+(totpc).toFixed(1)+'</td><td>'+ages[a].n.specific+'</td><td>'+(spepc).toFixed(1)+'</td></tr>';
					if(a!="total" && a!="undisclosed"){
						age.labels.push(a);
						// Show percentages
						age.series[0].data.push(totpc);
						age.series[1].data.push(spepc);
					}
				}
				this.cards.age.addPanels({
					'chart':{'label':'Barchart','class':'output chart'},
					'table':{'label':'Data','class':'output'}
				});
				if(ageout){
					
					this.cards.age.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Age bracket</th><th>Leeds #</th><th>Leeds %</th><th><span class="employer">Employer</span> #</th><th><span class="employer">Employer</span> %</th></tr>'+ageout+'</table><p>Numbers are rounded so may not add up to 100%</p>';
					tableSortJs();
					chart = new ODI.chart(this.cards.age.panels.chart.el,{'type':'bar','stacked':false});
					chart.setData(age).draw();
					chart.on('barover',function(e,a){
						this.target.querySelectorAll('.balloon').forEach(function(e){ e.remove(); });
						info = document.createElement('div');
						info.classList.add('balloon');
						info.innerHTML = this.data.series[e.series].label+": "+this.data.series[e.series].data[e.bin];
						e.event.originalTarget.appendChild(info);
					}).on('mouseleave',function(e){
						this.target.querySelectorAll('.balloon').forEach(function(e){ e.remove(); });
					});
					key = this.cards.age.el.querySelector('.key');
					if(!key){
						key = document.createElement('ul');
						key.classList.add('key');
						key.innerHTML = '<li><span class="series-0 key-item"></span> <span class="label">Leeds Employers</span></li><li><span class="series-1 key-item"></span> <span class="label">Employer</span></li>';
						this.cards.age.panels.chart.el.appendChild(key);
					}
					key.querySelector('.series-0 + .label').innerHTML = 'Leeds Employers ('+ages.total.n.total.toLocaleString()+')';
					key.querySelector('.series-1 + .label').innerHTML = '<span class="employer">Employer</span> ('+ages.total.n.specific.toLocaleString()+')';
				}
				

				// Update numbers
				document.querySelector('.lastupdated').innerHTML = (new Date(dates.max).toLocaleDateString('en-GB',{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
				document.querySelector('#employees .number').innerHTML = employees.toLocaleString();
				document.querySelector('#organisations .number').innerHTML = n.toLocaleString();
				document.querySelectorAll('.employer').forEach(function(e){ if(employer){ e.innerHTML = formatEmployer(employer.org,employer.div); } });
				if(summary) document.querySelector('#sources ul').innerHTML = summary;
			}

			return this.init(attr);
		}
		
		var dash = new Dashboard();

	});
	
})(window || this);
