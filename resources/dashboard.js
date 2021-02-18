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
						if(panels[id].events) this.panels[id].events = panels[id].events;
						// Add it after the header or previously added output areas
						end.insertAdjacentElement('afterend',o);
						end = o;
						
						if(panels[id].chart) this.chart = new ODI.chart(this.panels[id].el,panels[id].chart);
						
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
									this.addData(attr.data.url,CSVToArray(d).data);
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

			this.addData = function(url,d){
				// Convert numbers into numbers
				for(r = 0; r < d.length; r++){
					for(o in d[r]){
						v = parseFloat(d[r][o])
						if(typeof v==="number" && v==d[r][o]) d[r][o] = v;
					}
					if(!d[r].employees){
						console.error('No employee total given');
					}
					// Tidy up totals
					if(!d[r].age_total){
						d[r].age_total = d[r].employees;
						console.warn('No age "total" given for '+url);
					}
					if(!d[r].age_undisclosed){
						t = (d[r]['age_16-24']||0)+(d[r]['age_25-34']||0)+(d[r]['age_35-44']||0)+(d[r]['age_45-54']||0)+(d[r]['age_55-64']||0)+(d[r]['age_65-69']||0)+(d[r]['age_70']||0);
						d[r].age_undisclosed = d[r].age_total-t;
						console.warn('No age "undisclosed" for '+url+' so using '+d[r].age_undisclosed+'/'+d[r].age_total);
					}
				}
				this.data[url] = d;
				console.info('Add '+url,this.data[url]);
				return this;
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
					orgtmp = (d.organisation);
					divtmp = (d.organisation_division||"_none");
					if(this.data[this.index[i].URL]){
						for(var j = 0; j < this.data[this.index[i].URL].length; j++){
							d2 = this.data[this.index[i].URL][j];
							org = d2.organisation;
							div = (d2.organisation_division||"_none");
							if(orgtmp == org && divtmp == div){
								if(!orgs[org]) orgs[org] = {};
								if(!orgs[org][div]){
									orgs[org][div] = {};
									orgopts += '<option data-org="'+org+'" data-div="'+div+'"'+(employer && employer.org==org && employer.div==div ? ' selected="selected"' : '')+'>'+formatEmployer(org,d2.organisation_division)+'</option>'
								}
								if(typeof d2.published==="string"){
									orgs[org][div][d2.published] = d2;
									orgs[org][div][d2.published].URL = d.URL;
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
				//employer = this.getEmployer();
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
				var data = {
					"ages":{
						"16-24":{"keys":["age_16-24"],"n":{"total":0,"specific":0}},
						"25-34":{"keys":["age_25-34"],"n":{"total":0,"specific":0}},
						"35-44":{"keys":["age_35-44"],"n":{"total":0,"specific":0}},
						"45-54":{"keys":["age_45-54"],"n":{"total":0,"specific":0}},
						"55-64":{"keys":["age_55-64"],"n":{"total":0,"specific":0}},
						"65-69":{"keys":["age_65-69"],"n":{"total":0,"specific":0}},
						"70+":{"keys":["age_70+"],"n":{"total":0,"specific":0}},
						"total":{"keys":["age_total"],"n":{"total":0,"specific":0}},
						"undisclosed":{"keys":["age_undisclosed"],"n":{"total":0,"specific":0}}
					},
					"carers":{
						"yes":{"keys":["carer_yes"],"n":{"total":0,"specific":0}},
						"no":{"keys":["carer_no"],"n":{"total":0,"specific":0}},
						"prefernottosay":{"keys":["carer_prefernottosay"],"n":{"total":0,"specific":0}},
						"undisclosed":{"keys":["carer_undisclosed"],"n":{"total":0,"specific":0}},
						"total":{"keys":["carer_total"],"n":{"total":0,"specific":0}}
					},
					"disability":{
						"yes":{"keys":["disability_yes"],"n":{"total":0,"specific":0}},
						"no":{"keys":["disability_no"],"n":{"total":0,"specific":0}},
						"prefernottosay":{"keys":["disability_prefernottosay"],"n":{"total":0,"specific":0}},
						"undisclosed":{"keys":["disability_undisclosed"],"n":{"total":0,"specific":0}},
						"total":{"keys":["disability_total"],"n":{"total":0,"specific":0}}
					},
					"gender":{
						"female":{"keys":["gender_female"],"n":{"total":0,"specific":0}},
						"male":{"keys":["gender_male"],"n":{"total":0,"specific":0}},
						"diverse":{"keys":["gender_diverse"],"n":{"total":0,"specific":0}},
						"prefernottosay":{"keys":["gender_prefernottosay"],"n":{"total":0,"specific":0}},
						"undisclosed":{"keys":["gender_undisclosed"],"n":{"total":0,"specific":0}},
						"total":{"keys":["gender_total"],"n":{"total":0,"specific":0}}
					}
				}

				// Clean up data - add in missing totals etc
				for(i = 0; i < keep.length; i++){
					employees += keep[i].employees;
					dt = new Date(keep[i].published);
					// Process ages
					for(s in data){
						for(a in data[s]){
							for(k = 0 ; k < data[s][a].keys.length; k++){
								ky = data[s][a].keys[k];
								if(typeof keep[i][ky]==="number"){
									data[s][a].n.total += keep[i][ky];
									if(employer && keep[i].organisation==employer.org && (!keep[i].organisation_division || keep[i].organisation_division==employer.div)) data[s][a].n.specific += keep[i][ky];
								}
							}
						}
					}
					summary += '<li><a href="'+keep[i].URL+'">'+formatEmployer(keep[i].organisation,keep[i].organisation_division)+'</a> updated <time datetime="'+keep[i].published+'">'+dt.toLocaleDateString('en-GB',{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })+'</time></li>';
					n++;
				}
				var horizpanel = {
					'chart':{
						'label':'Barchart',
						'class':'output chart',
						'chart': {
							'type': 'bar',
							'dir': 'horizontal',
							'formatY': function(v,attr){
								if(!v) return "";
								return v.toFixed(1).replace(/\.0/,"")+'%';
							}
						},
						'events':{
							'barover':function(e,a){
								removeBalloons();
								info = document.createElement('div');
								info.classList.add('balloon');
								i = this.data[e.cluster].data[e.series];
								info.innerHTML = i.label+": "+this.attr.formatY(i.v);
								e.event.originalTarget.appendChild(info);
							},
							'mouseleave':function(e){
								removeBalloons();
							}
						}
					},
					'table':{'label':'Data','class':'output'}
				}
				this.cards.ages.addPanels({
					'chart':{
						'label':'Barchart',
						'class':'output chart',
						'chart': {
							'type': 'bar',
							'formatY': function(v){
								if(!v) return "";
								return v.toFixed(1).replace(/\.0/,"")+'%';
							}
						},
						'events':{
							'barover':function(e,a){
								removeBalloons();
								info = document.createElement('div');
								info.classList.add('balloon');
								i = (this.data[e.cluster].data[e.series].data) ? this.data[e.cluster].data[e.series].data[e.bin] : this.data[e.cluster].data[e.series];
								info.innerHTML = i.label+": "+this.attr.formatY(i.v);
								e.event.originalTarget.appendChild(info);
							},
							'mouseleave':function(e){
								removeBalloons();
							}
						}
					},
					'table':{'label':'Data','class':'output'}
				});
				this.cards.carers.addPanels(horizpanel);
				this.cards.disability.addPanels(horizpanel);
				this.cards.gender.addPanels(horizpanel);
				g = {
					'ages':{'html':'','data': []},
					'carers':{'html':'','data': []},
					'disability':{'html':'','data': []},
					'gender':{'html':'','data': []}
				}
				for(s in data){
					for(a in data[s]){
						totpc = (data[s].total.n.total > 0 ? (100*data[s][a].n.total/data[s].total.n.total) : 0);
						spepc = (data[s].total.n.specific > 0 ? 100*(data[s][a].n.specific||0)/data[s].total.n.specific : 0);
						if(s=="ages"){
							g.ages.html += '<tr><td>'+a+'</td><td>'+data[s][a].n.total+'</td><td>'+(totpc).toFixed(1)+'</td><td>'+data[s][a].n.specific+'</td><td>'+(spepc).toFixed(1)+'</td></tr>';
							if(a!="total" && a!="undisclosed"){
								g.ages.data.push({'label':a,'data':[{'v':totpc,'label':'Leeds'},{'v':spepc,'label':'Employer'}]});
								// Show percentages
	//							g.ages.data[0].data.push({'v':totpc,'label':a});
		//						g.ages.data[1].data.push({'v':spepc,'label':a});
							}
						}
					}
					if(s=="carers"){
						ys_l = no_l = pf_l = un_l = ys_e = no_e = pf_e = un_e = 0;
						if(data.carers.total.n.total > 0){
							ys_l = 100*data.carers.yes.n.total/data.carers.total.n.total;
							no_l = 100*data.carers.no.n.total/data.carers.total.n.total;
							pf_l = 100*data.carers.prefernottosay.n.total/data.carers.total.n.total;
							un_l = 100*data.carers.undisclosed.n.total/data.carers.total.n.total;
						}
						if(data.carers.total.n.specific > 0){
							ys_e = 100*data.carers.yes.n.specific/data.carers.total.n.specific;
							no_e = 100*data.carers.no.n.specific/data.carers.total.n.specific;
							pf_e = 100*data.carers.prefernottosay.n.specific/data.carers.total.n.specific;
							un_e = 100*data.carers.undisclosed.n.specific/data.carers.total.n.specific;
						}
						if(data.carers.yes.n.total + data.carers.no.n.total + data.carers.prefernottosay.n.total + data.carers.undisclosed.n.total > data.carers.total.n.total) console.warn('Carers: Total of Yes/No/Prefer-not-to-say/undisclosed is greater than '+data.carers.total.n.total);
						
						g.carers.html += '<tr><td>Leeds</span></td><td>'+data.carers.yes.n.total+'</td><td>'+ys_l.toFixed(1)+'</td><td>'+data.carers.no.n.total+'</td><td>'+no_l.toFixed(1)+'</td><td>'+data.carers.prefernottosay.n.total+'</td><td>'+pf_l.toFixed(1)+'</td><td>'+data.carers.undisclosed.n.total+'</td><td>'+un_l.toFixed(1)+'</td></tr>';
						g.carers.html += '<tr><td><span class="employer">Employer</span></span></td><td>'+data.carers.yes.n.specific+'</td><td>'+ys_e.toFixed(1)+'</td><td>'+data.carers.no.n.specific+'</td><td>'+no_e.toFixed(1)+'</td><td>'+data.carers.prefernottosay.n.specific+'</td><td>'+pf_e.toFixed(1)+'</td><td>'+data.carers.undisclosed.n.specific+'</td><td>'+un_e.toFixed(1)+'</td></tr>';
						g.carers.data.push({
							'label': 'Leeds',
							'stacked': true,
							'data': [
								{'label':'Yes','class':'cat-0','v':ys_l},
								{'label':'No','class':'cat-0','v':no_l},
								{'label':'Prefer not to say','class':'cat-0','v':pf_l},
								{'label':'Undisclosed','class':'cat-0','v':un_l}
							]
						});
						g.carers.data.push({
							'label':'Employer',
							'stacked': true,
							'data': [
								{'label':'Yes','class':'cat-1','v':ys_e},
								{'label':'No','class':'cat-1','v':no_e},
								{'label':'Prefer not to say','class':'cat-1','v':pf_e},
								{'label':'Undisclosed','class':'cat-1','v':un_e}
							]
						});
					}
					if(s=="disability"){
						ys_l = 0;
						no_l = 0;
						pf_l = 0;
						un_l = 0;
						ys_e = 0;
						no_e = 0;
						pf_e = 0;
						un_e = 0;
						if(data.disability.total.n.total > 0){
							ys_l = 100*data.disability.yes.n.total/data.disability.total.n.total;
							no_l = 100*data.disability.no.n.total/data.disability.total.n.total;
							pf_l = 100*data.disability.prefernottosay.n.total/data.disability.total.n.total;
							un_l = 100*data.disability.undisclosed.n.total/data.disability.total.n.total;
						}
						if(data.disability.total.n.specific > 0){
							ys_e = 100*data.disability.yes.n.specific/data.disability.total.n.specific;
							no_e = 100*data.disability.no.n.specific/data.disability.total.n.specific;
							pf_e = 100*data.disability.prefernottosay.n.specific/data.disability.total.n.specific;
							un_e = 100*data.disability.undisclosed.n.specific/data.disability.total.n.specific;
						}
						if(data.disability.yes.n.total + data.disability.no.n.total + data.disability.prefernottosay.n.total + data.disability.undisclosed.n.total > data.disability.total.n.total) console.warn('Disability: Total of Yes/No/Prefer-not-to-say/undisclosed is greater than '+data.disability.total.n.total);
						
						g.disability.html += '<tr><td>Leeds</span></td><td>'+data.disability.yes.n.total+'</td><td>'+ys_l.toFixed(1)+'</td><td>'+data.disability.no.n.total+'</td><td>'+no_l.toFixed(1)+'</td><td>'+data.disability.prefernottosay.n.total+'</td><td>'+pf_l.toFixed(1)+'</td><td>'+data.disability.undisclosed.n.total+'</td><td>'+un_l.toFixed(1)+'</td></tr>';
						g.disability.html += '<tr><td><span class="employer">Employer</span></span></td><td>'+data.disability.yes.n.specific+'</td><td>'+ys_e.toFixed(1)+'</td><td>'+data.disability.no.n.specific+'</td><td>'+no_e.toFixed(1)+'</td><td>'+data.disability.prefernottosay.n.specific+'</td><td>'+pf_e.toFixed(1)+'</td><td>'+data.disability.undisclosed.n.specific+'</td><td>'+un_e.toFixed(1)+'</td></tr>';
						g.disability.data.push({
							'label': 'Leeds',
							'stacked': true,
							'data': [
								{'label':'Yes','class':'cat-0','v':ys_l},
								{'label':'No','class':'cat-0','v':no_l},
								{'label':'Prefer not to say','class':'cat-0','v':pf_l},
								{'label':'Undisclosed','class':'cat-0','v':un_l}
							]
						});
						g.disability.data.push({
							'label':'Employer',
							'stacked': true,
							'data': [
								{'label':'Yes','class':'cat-1','v':ys_e},
								{'label':'No','class':'cat-1','v':no_e},
								{'label':'Prefer not to say','class':'cat-1','v':pf_e},
								{'label':'Undisclosed','class':'cat-1','v':un_e}
							]
						});
					}
					if(s=="gender"){
						pc = {'f':{'all':0,'spec':0},'m':{'all':0,'spec':0},'d':{'all':0,'spec':0},'p':{'all':0,'spec':0},'u':{'all':0,'spec':0},'t':{'all':0,'spec':0}};
						if(data.gender.total.n.total > 0){
							pc.f.all = 100*data.gender.female.n.total/data.gender.total.n.total;
							pc.m.all = 100*data.gender.male.n.total/data.gender.total.n.total;
							pc.d.all = 100*data.gender.diverse.n.total/data.gender.total.n.total;
							pc.p.all = 100*data.gender.prefernottosay.n.total/data.gender.total.n.total;
							pc.u.all = 100*data.gender.undisclosed.n.total/data.gender.total.n.total;
						}
						if(data.gender.total.n.specific > 0){
							pc.f.spec = 100*data.gender.female.n.specific/data.gender.total.n.specific;
							pc.m.spec = 100*data.gender.male.n.specific/data.gender.total.n.specific;
							pc.d.spec = 100*data.gender.diverse.n.specific/data.gender.total.n.specific;
							pc.p.spec = 100*data.gender.prefernottosay.n.specific/data.gender.total.n.specific;
							pc.u.spec = 100*data.gender.undisclosed.n.specific/data.gender.total.n.specific;
						}
						if(data.gender.female.n.total + data.gender.male.n.total + data.gender.prefernottosay.n.total + data.gender.undisclosed.n.total > data.gender.total.n.total) console.warn('Gender: Total of options is greater than '+data.gender.total.n.total);
						
						g.gender.html += '<tr><td>Leeds</span></td><td>'+data.gender.female.n.total+'</td><td>'+pc.f.all.toFixed(1)+'</td><td>'+data.gender.male.n.total+'</td><td>'+pc.m.all.toFixed(1)+'</td><td>'+data.gender.prefernottosay.n.total+'</td><td>'+pc.p.all.toFixed(1)+'</td><td>'+data.gender.undisclosed.n.total+'</td><td>'+pc.u.all.toFixed(1)+'</td></tr>';
						g.gender.html += '<tr><td><span class="employer">Employer</span></span></td><td>'+data.gender.female.n.specific+'</td><td>'+pc.f.spec.toFixed(1)+'</td><td>'+data.gender.male.n.specific+'</td><td>'+pc.m.spec.toFixed(1)+'</td><td>'+data.gender.prefernottosay.n.specific+'</td><td>'+pc.p.spec.toFixed(1)+'</td><td>'+data.gender.undisclosed.n.specific+'</td><td>'+pc.u.spec.toFixed(1)+'</td></tr>';
						g.gender.data.push({
							'label': 'Leeds',
							'stacked': true,
							'data': [
								{'label':'Female','class':'cat-0','v':pc.f.all},
								{'label':'Male','class':'cat-0','v':pc.m.all},
								{'label':'Diverse','class':'cat-0','v':pc.d.all},
								{'label':'Prefer not to say','class':'cat-0','v':pc.p.all},
								{'label':'Undisclosed','class':'cat-0','v':pc.u.all}
							]
						});
						g.gender.data.push({
							'label':'Employer',
							'stacked': true,
							'data': [
								{'label':'Female','class':'cat-1','v':pc.f.spec},
								{'label':'Male','class':'cat-1','v':pc.m.spec},
								{'label':'Diverse','class':'cat-1','v':pc.d.spec},
								{'label':'Prefer not to say','class':'cat-1','v':pc.p.spec},
								{'label':'Undisclosed','class':'cat-1','v':pc.u.spec}
							]
						});
					}
				}

				if(g.ages.html){
					this.cards.ages.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Age bracket</th><th>Leeds #</th><th>Leeds %</th><th><span class="employer">Employer</span> #</th><th><span class="employer">Employer</span> %</th></tr>'+g.ages.html+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
					this.cards.ages.chart.setData(g.ages.data).draw();
					for(e in this.cards.ages.panels.chart.events) this.cards.ages.chart.on(e,this.cards.ages.panels.chart.events[e]);
					key = this.cards.ages.el.querySelector('.key');
					if(!key){
						key = document.createElement('div');
						key.classList.add('key');
						key.innerHTML = '<ul><li><span class="series-0 key-item"></span> <span class="label">Leeds Employers</span></li><li><span class="series-1 key-item"></span> <span class="label">Employer</span></li></ul><p class="extranotes"></p>';
						this.cards.ages.panels.chart.el.appendChild(key);
					}
					key.querySelector('.series-0 + .label').innerHTML = 'Leeds Employers - '+data.ages.total.n.total.toLocaleString()+' employee'+(data.ages.total.n.total==1?'':'s')+' total';
					key.querySelector('.series-1 + .label').innerHTML = '<span class="employer">Employer</span> - '+data.ages.total.n.specific.toLocaleString()+' employee'+(data.ages.total.n.specific==1?'':'s')+' total';
					key.querySelector('.extranotes').innerHTML = (employees>data.ages.total.n.total ? '<p>There are '+(employees-data.ages.total.n.total).toLocaleString()+' employees without age data':'');
				}
				if(g.carers.html){
					this.cards.carers.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Type</th><th>Carer #</th><th>Carer %</th><th>Not a carer #</th><th>Not a carer %</th><th>Prefer not to say #</th><th>Prefer not to say %</th><th>Undisclosed #</th><th>Undisclosed %</th></tr>'+g.carers.html+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
					this.cards.carers.chart.setData(g.carers.data).draw();
					for(e in this.cards.carers.panels.chart.events) this.cards.carers.chart.on(e,this.cards.carers.panels.chart.events[e]);
					key = this.cards.carers.el.querySelector('.key');
					if(!key){
						key = document.createElement('div');
						key.classList.add('key');
						key.innerHTML = '<ul><li><span class="series-0 key-item"></span> <span class="label">Yes</span></li><li><span class="series-1 key-item"></span> <span class="label">No</span></li><li><span class="series-2 key-item"></span> <span class="label">Prefer not to say</span></li><li><span class="series-3 key-item"></span> <span class="label">Undisclosed</span></li></ul><p class="extranotes"></p>';
						this.cards.carers.panels.chart.el.appendChild(key);
					}
					key.querySelector('.extranotes').innerHTML = (employees>data.carers.total.n.total ? '<p>There are '+(employees-data.carers.total.n.total).toLocaleString()+' employees without carer data':'');
				}
				if(g.disability.html){
					this.cards.disability.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Type</th><th>Disability #</th><th>Disability %</th><th>No disability #</th><th>No disability %</th><th>Prefer not to say #</th><th>Prefer not to say %</th><th>Undisclosed #</th><th>Undisclosed %</th></tr>'+g.disability.html+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
					this.cards.disability.chart.setData(g.disability.data).draw();
					for(e in this.cards.disability.panels.chart.events) this.cards.disability.chart.on(e,this.cards.disability.panels.chart.events[e]);
					key = this.cards.disability.el.querySelector('.key');
					if(!key){
						key = document.createElement('div');
						key.classList.add('key');
						key.innerHTML = '<ul><li><span class="series-0 key-item"></span> <span class="label">Yes</span></li><li><span class="series-1 key-item"></span> <span class="label">No</span></li><li><span class="series-2 key-item"></span> <span class="label">Prefer not to say</span></li><li><span class="series-3 key-item"></span> <span class="label">Undisclosed</span></li></ul><p class="extranotes"></p>';
						this.cards.disability.panels.chart.el.appendChild(key);
					}
					//key.querySelector('.extranotes').innerHTML = (employees>data.ages.total.n.total ? '<p>There are '+(employees-data.ages.total.n.total).toLocaleString()+' employees without age data':'');
				}
				if(g.gender.html){
					this.cards.gender.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Type</th><th>Female #</th><th>Female %</th><th>Male #</th><th>Male %</th><th>Prefer not to say #</th><th>Prefer not to say %</th><th>Undisclosed #</th><th>Undisclosed %</th></tr>'+g.gender.html+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
					this.cards.gender.chart.setData(g.gender.data).draw();
					for(e in this.cards.gender.panels.chart.events) this.cards.gender.chart.on(e,this.cards.gender.panels.chart.events[e]);
					key = this.cards.gender.el.querySelector('.key');
					if(!key){
						key = document.createElement('div');
						key.classList.add('key');
						key.innerHTML = '<ul><li><span class="series-0 key-item"></span> <span class="label">Female</span></li><li><span class="series-1 key-item"></span> <span class="label">Male</span></li><li><span class="series-2 key-item"></span> <span class="label">Diverse</span></li><li><span class="series-3 key-item"></span> <span class="label">Prefer not to say</span></li><li><span class="series-4 key-item"></span> <span class="label">Undisclosed</span></li></ul><p class="extranotes"></p>';
						this.cards.gender.panels.chart.el.appendChild(key);
					}
					//key.querySelector('.extranotes').innerHTML = (employees>data.ages.total.n.total ? '<p>There are '+(employees-data.ages.total.n.total).toLocaleString()+' employees without age data':'');
				}
				
				// Make tables sortable
				tableSortJs();

				// Update numbers
				document.querySelector('.lastupdated').innerHTML = (new Date(dates.max).toLocaleDateString('en-GB',{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
				document.querySelector('#employees .number').innerHTML = employees.toLocaleString();
				document.querySelector('#organisations .number').innerHTML = n.toLocaleString();
				document.querySelectorAll('.employer').forEach(function(e){ if(employer){ e.innerHTML = formatEmployer(employer.org,employer.div)||"No employer selected"; } });
				if(summary) document.querySelector('#sources ul').innerHTML = summary;
			}

			return this.init(attr);
		}

		function removeBalloons(){
			b = document.querySelectorAll('.balloon');
			if(b) b.forEach(function(e){ e.remove(); });
			return;
		}
		
		var dash = new Dashboard();

	});
	
})(window || this);
