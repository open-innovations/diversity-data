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
		// Version 1.2
		if(!opt) opt = {};
		var req = new XMLHttpRequest();
		var responseTypeAware = 'responseType' in req;
		if(responseTypeAware && opt.dataType) req.responseType = opt.dataType;
		req.open((opt.method||'GET'),url+(typeof opt.cache===null || (typeof opt.cache==="boolean" && !opt.cache) ? '?'+Math.random() : ''),true);
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

	function Card(attr){
		if(!attr) attr = {};
		if(attr.el) this.el = attr.el;
		this.o = this.el.querySelector('.output');
		this.header = this.el.querySelector('header');
		var _obj = this;
		function togglePanels(e){
			var pid,id;
			id = e.target.getAttribute('data-id');
			_obj.el.querySelectorAll('.open').forEach(function(e){ e.setAttribute('aria-selected',false); e.classList.remove('open'); });
			for(pid in _obj.panels){
				if(pid==id){
					_obj.nav.tabs[pid].el.classList.add('open');
					_obj.nav.tabs[pid].el.setAttribute('aria-selected',true);
					_obj.panels[pid].el.classList.add('open');
				}else{
					_obj.nav.tabs[pid].el.setAttribute('aria-selected',false);
				}
			}
			return;
		}
		this.addPanels = function(panels){
			var i,b,c,o,end,id,cls;
			if(!this.nav && panels){
				this.nav = {'el':document.createElement('div'),'tabs':{}};
				this.panels = {};
				this.nav.el.classList.add('tabs');
				this.nav.el.setAttribute('role','tablist');
				end = this.header;
				if(this.el.querySelector('summary')) end = this.el.querySelector('summary');
				end.insertAdjacentElement('afterend', this.nav.el);
				end = this.nav.el;
				i = 0;
				for(id in panels){
					if(panels[id]){
						b = document.createElement('button');
						b.innerHTML = panels[id].label;
						b.setAttribute('data-id',id);
						b.setAttribute('role','tab');
						b.setAttribute('tabindex',0);
						this.nav.tabs[id] = {'el':b};
						this.nav.el.appendChild(b);
						if(i==0){
							b.classList.add('open');
							b.setAttribute('aria-selected',true);
						}else{
							b.setAttribute('aria-selected',false);
						}
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
			}
			return this;
		};
		return this;
	}

	function Loader(_parent){
		var el = document.createElement('div');
		el.classList.add('spinner');
		el.innerHTML = '<img src="https://odileeds.org/resources/images/odi.svg" alt="Loading..." />';
		_parent.appendChild(el);
		this.remove = function(){ _parent.innerHTML = ''; };
		this.error = function(msg){ _parent.innerHTML = '<span class="error">'+msg+'</span>'; };
		return this;
	}

	// Following advice from https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Tab_Role
	function TabbedNav(opt){
		if(!opt) return this;
		if(!opt.el) return this;
		var tabs,tabList,tabFocus,tabPanels,keys,i,id,_obj;
		
		tabs = opt.el.querySelectorAll('[role="tab"]');
		tabList = opt.el.querySelector('[role="tablist"]');
		tabPanels = opt.panels;
		tabFocus = 0;
		this.selected = null;
		this.selectedID = "";
		
		keys = {
			end: 35,
			home: 36,
			left: 37,
			up: 38,
			right: 39,
			down: 40,
			delete: 46
		};
		_obj = this;

		this.selectTab = function(e,triggered){
			var i,sel,t,p,tabid;
			if(typeof e==="number") e = {'target':tabs[i]};
			else if(typeof e==="string"){
				sel = -1;
				for(i = 0; i < tabs.length; i++){
					if(tabs[i].getAttribute('aria-controls')==e) sel = i;
				}
				if(sel >= 0) e = {'target':tabs[sel]};
				else{
					console.error('Not a valid string '+e);
					return;
				}
			}
			t = e.target;
			p = t.parentNode;

			// Update selection
			_obj.selected = t;
			_obj.selectedID = t.getAttribute('aria-controls');

			// Remove all current selected tabs
			p.querySelectorAll('[aria-selected="true"]').forEach(function(tab){ tab.setAttribute("aria-selected", false); });

			// Set this tab as selected
			t.setAttribute("aria-selected", true);

			tabid = t.getAttribute('aria-controls');

			// Hide all tab panels except for the active one
			tabPanels.forEach(function(e){
				var id = e.getAttribute('id');
				if(id==tabid) e.removeAttribute('hidden');
				else e.setAttribute("hidden", true);
			});

			// If this wasn't a triggered event we add it to the history
			if(!triggered && typeof opt.callback==="function") opt.callback.call(opt.this||this);
			return this;
		};

		for(i = 0; i < tabs.length; i++){
			id = tabs[i].getAttribute('aria-controls');
			tabs[i].addEventListener('focus',this.selectTab);
			if(opt.selected && id==opt.selected) this.selectTab(i,true);
		}
		tabList.addEventListener("keydown",function(e){
			tabs[tabFocus].setAttribute('tabindex',-1);
			if(e.keyCode === keys.left || e.keyCode === keys.right){
				// Move right
				if(e.keyCode === keys.right){
					tabFocus++;
					// If we're at the end, go to the start
					if(tabFocus >= tabs.length) tabFocus = 0;
					// Move left
				}else if(e.keyCode === keys.left){
					tabFocus--;
					// If we're at the start, move to the end
					if(tabFocus < 0) tabFocus = tabs.length - 1;
				}

				tabs[tabFocus].setAttribute("tabindex", 0);
				tabs[tabFocus].focus();
			}
		});
		return this;
	}

	function parseHREF(h){
		var q,a,rtn,i,bits,b,key;
		h = h.replace(/.*\?/,"");
		q = "";
		a = "age";
		i = h.indexOf("#");
		if(i >= 0){
			q = h.substr(0,i);
			a = h.substr(i+1);
		}else{
			q = h;
		}
		rtn = {'anchor':a,'compare':{}};
		if(q.indexOf('&') >= 0){
			bits = q.split(/\&/);
			
			for(b = 0; b < bits.length; b++){
				bits[b] = bits[b].split(/=/);
				if(bits[b][0]=="area"){
					rtn.compare[0] = {'area':bits[b][1]};
				}else{
					i = bits[b][0].replace(/[\D]/g,"");
					key = bits[b][0].replace(/[0-9]/g,"");
					if(key=="org" || key=="div" || key=="lvl" || key=="date"){
						if(!rtn.compare[i]) rtn.compare[i] = {};
						rtn.compare[i][key] = decodeURIComponent(bits[b][1]);
					}else{
						rtn[key] = decodeURIComponent(bits[b][1]);
					}
				}
			}
		}else{
			bits = q.split(/=/);
			if(bits[0]=="area") rtn.compare[0] = {'area':bits[1]};
		}
		return rtn;
	}
	
	var qs = parseHREF(location.href);


	function Dashboard(attr){
		this.el = document.getElementById('dashboard');
		this.data = {};
		if(!attr) attr = {};
		this.attr = attr;

		this.logging = (qs.debug=="true");
		this.log = function(){
			// Version 1.1
			if(this.logging || arguments[0]=="ERROR" || arguments[0]=="WARNING"){
				var args = Array.prototype.slice.call(arguments, 0);
				// Build basic result
				var extra = ['%c'+this.title+'%c: '+args[1],'font-weight:bold;',''];
				// If there are extra parameters passed we add them
				if(args.length > 2) extra = extra.concat(args.splice(2));
				if(console && typeof console.log==="function"){
					if(arguments[0] == "ERROR") console.error.apply(null,extra);
					else if(arguments[0] == "WARNING") console.warn.apply(null,extra);
					else if(arguments[0] == "INFO") console.info.apply(null,extra);
					else console.log.apply(null,extra);
				}
			}
			return this;
		};
		this.title = "ODI Leeds Diversity Dashboard";
		this.version = "1.2";
		this.log('INFO','version '+this.version,attr);
		this.selected = {'org':''};
		this.cache = {};
		this.orgs = {};
		this.loader = {};
		this.compare = [{}];
		this.lastupdate = "0000-00-00";
		this.format = {
			'age':{
				'0-14':{'_total':0},
				'15-24':{'_total':0},
				'25-34':{'_total':0},
				'35-44':{'_total':0},
				'45-54':{'_total':0},
				'55-64':{'_total':0},
				'65-69':{'_total':0},
				'70+':{'_total':0},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'carer':{
				'yes':{
					'1-19':{'_total':0},
					'20-49':{'_total':0},
					'50':{'_total':0},
					'_total':0,
					'_label':'Yes'
				},
				'no':{'_total':0,'_label':'No'},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'disability':{
				'yes':{
					'daytodayalot':{'_total':0},
					'daytodayalittle':{'_total':0},
					'_total': 0,
					'_label':'Yes'
				},
				'no':{'_total':0,'_label':'No'},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'ethnicity':{
				'asian':{
					'bangladeshi':{'_total':0},
					'chinese':{'_total':0},
					'indian':{'_total':0},
					'pakistani':{'_total':0},
					'other':{'_total':0},
					'_total':0,
					'_label':'Asian or Asian British'
				},
				'black':{
					'african':{'_total':0},
					'caribbean':{'_total':0},
					'other':{'_total':0},
					'_total':0,
					'_label':'Black, African, Caribbean or Black British'
				},
				'mixed':{
					'african':{'_total':0},
					'asian':{'_total':0},
					'caribbean':{'_total':0},
					'other':{'_total':0},
					'_total':0,
					'_label':'Mixed or Multiple ethnic groups'
				},
				'other':{
					'arab':{'_total':0},
					'anyother':{'_total':0},
					'_total':0,
					'_label':'Other ethnic group'
				},
				'white':{
					'british':{'_total':0},
					'irish':{'_total':0},
					'traveller':{'_total':0},
					'other':{'_total':0},
					'_total':0,
					'_label':'White'
				},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'gender':{
				'female':{'_total':0,'_label':'Female'},
				'male':{'_total':0,'_label':'Male'},
				'other':{'_total':0,'_label':'Other'},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'religion':{
				'buddhist':{'_total':0,'_label':'Buddhist'},
				'christian':{'_total':0,'_label':'Christian'},
				'hindu':{'_total':0,'_label':'Hindu'},
				'jewish':{'_total':0,'_label':'Jewish'},
				'muslim':{'_total':0,'_label':'Muslim'},
				'no':{'_total':0,'_label':'None'},
				'other':{'_total':0,'_label':'Other'},
				'sikh':{'_total':0,'_label':'Sikh'},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'seb':{
				"lower": {'_total':0,'_label':'Lower'},
				"intermediate": {'_total':0,'_label':'Intermediate'},
				"professional": {'_total':0,'_label':'Professional'},
				'prefernottosay': {'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			},
			'sexuality':{
				'bisexual':{'_total':0,'_label':'Bisexual'},
				'gaylesbian':{'_total':0,'_label':'Gay or Lesbian'},
				'straight':{'_total':0,'_label':'Straight (heterosexual)'},
				'usedifferentterm':{'_total':0,'_label':'Use a different term'},
				'prefernottosay':{'_total':0,'_label':'Prefer not to say'},
				'undisclosed':{'_total':0,'_label':'Undisclosed'},
				'total':{'_total':0,'_label':'Total'}
			}
		};

		var _obj = this;

		this.init = function(attr){
			var i,cards,cls,id;
			if(!attr) attr = {};
			this.log('MESSAGE','init',attr);
			if(!attr.index){
				this.log('ERROR','No index file provided');
				return this;
			}
			
			// Build the cards
			cards = this.el.querySelectorAll(attr.cards||'.facet');
			this.cards = {};
			for(i = 0; i < cards.length; i++){
				id = cards[i].getAttribute('id');
				if(id) this.cards[id] = new Card({'el':cards[i]});
			}
			// Make navigation accessible
			this.nav = new TabbedNav({'el':attr.comparison.nav,'panels':cards,'this':this,'callback': this.updateHistory });


			
			// Update the state of the area (it won't process orgs just yet)
			this.setStateFromHREF();

			// Load the index file
			ODI.ajax(attr.index,{
				"this": this,
				"dataType": "text",
				"success": function(d){
					d = CSVToArray(d);
					this.index = d.data;
					var i,u,urls,toload,loaded;
					urls = {};
					toload = 0;
					loaded = 0;
					for(i = 0; i < d.data.length; i++){
						if(d.data[i].URL && !urls[d.data[i].URL]){
							toload++;
							urls[d.data[i].URL] = true;
						}
					}
					// Load each URL in the index
					for(u in urls){
						if(urls[u]){
							this.data[u] = {};
							ODI.ajax(u,{
								"this": this,
								"dataType": "text",
								"url": u,
								"success": function(d,attr){
									this.cache[attr.data.url] = {'csv':d,'loaded':true};
									// Store the data
									this.addData(attr.data.url,CSVToArray(d).data);
									// Increment the loaded counter
									loaded++;
									// If we've loaded them all we finish up
									if(toload == loaded) this.loaded();
								}
							});
						}
					}
				}
			});

			// Add events to comparison form
			if(attr.comparison){
				if(attr.comparison.add) attr.comparison.add.addEventListener('click',function(e){ e.preventDefault(); _obj.toggleDialog("show"); });
				if(attr.comparison.org) attr.comparison.org.addEventListener('change', function(e){ _obj.selected.org = e.currentTarget.value; _obj.selected.div = "_none"; _obj.selected.lvl = "_none"; _obj.selected.date = ""; _obj.updateOptions(); });
				if(attr.comparison.division) attr.comparison.division.addEventListener('change', function(e){ _obj.selected.div = e.currentTarget.value||"_none"; _obj.updateOptions(); });
				if(attr.comparison.level) attr.comparison.level.addEventListener('change', function(e){ _obj.selected.lvl = e.currentTarget.value||"_none"; _obj.updateOptions(); });
				if(attr.comparison.date) attr.comparison.date.addEventListener('change', function(e){ _obj.selected.date = e.currentTarget.value; });
				if(attr.comparison.geography){
					// Load the new geography
					attr.comparison.geography.addEventListener('change',function(e){ _obj.loadGeography(_obj.update); });
				}
				this.dialogOpen = false;
				if(attr.comparison.dialog){
					if(!attr.comparison.dialogSubmit) attr.comparison.dialogSubmit = attr.comparison.dialog.querySelector('input[type=submit]');
					if(!attr.comparison.dialogDefault) attr.comparison.dialogDefault = attr.comparison.dialog.querySelector('select'); // Default form element to focus on
					cls = attr.comparison.dialog.querySelector('.close');

					attr.comparison.dialogSubmit.addEventListener('click',function(e){ e.preventDefault(); console.log('add comparison'); _obj.addComparison(); _obj.update(); _obj.toggleDialog(); _obj.updateHistory(); });
					if(!cls){
						cls = document.createElement('button');
						cls.classList.add('close');
						cls.innerHTML = "&times;";
						cls.setAttribute('aria-label','Close this dialog');
						attr.comparison.dialog.insertBefore(cls, attr.comparison.dialog.firstChild);
					}
					cls.addEventListener('click',function(e){
						e.preventDefault(); console.log('add comparison'); 
						_obj.toggleDialog();
					});
					cls.addEventListener('blur',function(e){
						if(_obj.dialogOpen){
							e.stopPropagation();
							// Set focus back to the dialog
							attr.comparison.dialogSubmit.focus();
						}
					});
				}
			}

			// Update page when history changes
			window.onpopstate = function(event){ _obj.setStateFromHREF(); _obj.update(); };

			return this;
		};

		this.makeQueryString = function(){
			var str,i;
			str = '';
			for(i = 0; i < this.compare.length;i++){
				if(i==0){
					str += 'area='+this.attr.comparison.geography.value;
				}else{
					str += (str ? '&':'')+'org'+i+'='+encodeURIComponent(this.compare[i].org);
					if(this.compare[i].div && this.compare[i].div!="_none") str += (str ? '&':'')+'div'+i+'='+encodeURIComponent(this.compare[i].div);
					if(this.compare[i].lvl && this.compare[i].lvl!="_none") str += (str ? '&':'')+'lvl'+i+'='+encodeURIComponent(this.compare[i].lvl);
					if(this.compare[i].date) str += (str ? '&':'')+'date'+i+'='+this.compare[i].date;
				}
			}
			if(qs.debug) str += (str ? '&':'')+'debug=true';
			if(this.nav.selectedID) str += '#'+this.nav.selectedID;
			return (str ? '?':'')+str;
		};

		this.updateHistory = function(){
			history.pushState({}, 'Diversity Data Dashboard', this.makeQueryString());
			return this;
		};

		this.setStateFromHREF = function(){
			var i,n;
			qs = parseHREF(location.href);
			this.log('MESSAGE','setStateFromHREF',qs);
			
			// Trigger panel change
			this.nav.selectTab(qs.anchor,true);

			// Set the geography
			if(qs.compare[0] && qs.compare[0].area) this.setGeography(qs.compare[0].area);

			n = Object.keys(qs.compare).length;

			// Remove existing comparisons
			this.removeComparisonAll();

			if(n > 1){
				// Loop over comparisons and add them
				for(i = 1; i < n; i++) this.addComparison(qs.compare[i]);
			}

			return this;
		};
		
		this.setGeography = function(geocode){
			if(!geocode) return this;
			attr.comparison.geography.value = geocode;
			this.loadGeography(this.change);

			return this;
		};

		this.toggleDialog = function(sh){
			this.log('MESSAGE','toggleDialog',attr.comparison.dialog);
			var bg = attr.comparison.main;
			if(sh == "show"){
				attr.comparison.dialogSubmit.setAttribute('class','');
				attr.comparison.dialogSubmit.classList.add('series-'+this.compare.length);
				this.dialogOpen = true;
				// Show the dialog
				attr.comparison.dialog.classList.remove('dialog-hidden');
				// Focus on the first <select> dropdown
				attr.comparison.dialog.querySelector('select').focus();
				// Hide the background
				if(bg){
					bg.setAttribute("aria-hidden","true");
					bg.classList.add('background');
					bg.setAttribute("aria-disabled","true");
				}
			}else{
				this.dialogOpen = false;
				// Hide the dialog
				attr.comparison.dialog.classList.add('dialog-hidden');
				// Show the background
				if(bg){
					bg.removeAttribute("aria-hidden");
					bg.removeAttribute("aria-disabled");
					bg.classList.remove('background');
				}
				attr.comparison.add.focus();				
			}
			return this;
		};
		function formatEmployer(o,d,l,date){
			return (o ? o+(d && d!="_none" ? ', '+d : '')+(l && l!="_none" ? ', '+l : '')+(date ? ' ('+date+')' : '') : "");
		}
		function sortObj(obj,rev){
			if(rev){
				return Object.keys(obj).sort().reverse().reduce(function (result, key) {
					result[key] = obj[key];
					return result;
				}, {});
			}else{
				return Object.keys(obj).sort().reduce(function (result, key) {
					result[key] = obj[key];
					return result;
				}, {});
			}
		}
		function addOption(el,value,txt,sel){
			var o = document.createElement('option');
			o.value = value;
			o.innerHTML = txt;
			if(value==sel) o.setAttribute('selected','selected');
			el.appendChild(o);
			return o;
		}
		this.updateOptions = function(){
			this.log('MESSAGE','updateOptions',this.selected);

			var added,org,div,lvl,dt;
			
			if(!this.selected.div) this.selected.div = "_none";
			if(!this.selected.lvl) this.selected.lvl = "_none";

			// Update organisation <select>
			this.attr.comparison.org.innerHTML = '<option value="">Select organisation</option>';
			// Sort the organisations
			this.orgs = sortObj(this.orgs);
			for(org in this.orgs){
				if(org){
					addOption(this.attr.comparison.org,org,org,this.selected.org);
				}
			}


			// Update division <select>
			added = 0;
			if(this.attr.comparison.division){
				this.attr.comparison.division.innerHTML = '<option value="_none">Select division</option>';
				if(this.selected.org && this.orgs[this.selected.org]){
					// Sort the divisions
					this.orgs[this.selected.org] = sortObj(this.orgs[this.selected.org]);
					added = 0;
					for(div in this.orgs[this.selected.org]){
						if(div != "_none"){
							addOption(this.attr.comparison.division,div,div,this.selected.div);
							added++;
						}else addOption(this.attr.comparison.division,div,'No division',this.selected.div);
					}
				}
			}else this.log('ERROR','No division <select> is provided');
			if(added==0) this.attr.comparison.division.setAttribute('disabled','disabled');
			else this.attr.comparison.division.removeAttribute('disabled');


			// Update level <select>
			added = 0;
			if(this.attr.comparison.level){
				this.attr.comparison.level.innerHTML = '<option value="_none">Select level</option>';
				if(this.selected.org && this.selected.div && this.orgs[this.selected.org] && this.orgs[this.selected.org][this.selected.div]){
					// Sort the levels
					this.orgs[this.selected.org][this.selected.div] = sortObj(this.orgs[this.selected.org][this.selected.div]);
					for(lvl in this.orgs[this.selected.org][this.selected.div]){
						if(lvl != "_none"){
							addOption(this.attr.comparison.level,lvl,lvl,this.selected.level);
							added++;
						}else addOption(this.attr.comparison.level,lvl,'No level',this.selected.level);
					}
				}
			}else this.log('ERROR','No division <select> is provided');
			if(added==0) this.attr.comparison.level.setAttribute('disabled','disabled');
			else this.attr.comparison.level.removeAttribute('disabled');

			// Update date <select>
			added = 0;
			if(this.attr.comparison.date){
				this.attr.comparison.date.innerHTML = '<option value="">Select date</option>';
				if(this.selected.org && this.selected.div && this.selected.lvl && this.orgs[this.selected.org] && this.orgs[this.selected.org][this.selected.div] && this.orgs[this.selected.org][this.selected.div][this.selected.lvl]){
					// Sort the levels
					this.orgs[this.selected.org][this.selected.div][this.selected.lvl] = sortObj(this.orgs[this.selected.org][this.selected.div][this.selected.lvl],true);
					for(dt in this.orgs[this.selected.org][this.selected.div][this.selected.lvl]){
						if(dt){
							addOption(this.attr.comparison.date,dt,dt,this.selected.date);
							added++;
						}
					}
				}
			}else this.log('ERROR','No division <select> is provided');
			if(added==0) this.attr.comparison.date.setAttribute('disabled','disabled');
			else this.attr.comparison.date.removeAttribute('disabled');

			return this;
		};

		// Get the data into a JSON format
		this.loaded = function(){
			this.log('MESSAGE','loaded');

			// Update the state of the orgs now that we've loaded them
			this.setStateFromHREF();
			
			this.loadGeography(function(){
				_obj.updateOptions();
				_obj.update();
			});

			return this;
		};

		this.loadGeography = function(cb){
			var geocode = attr.comparison.geography.value;
			this.log('MESSAGE','loadGeography',geocode);

			if(!this.loader.geography) this.loader.geography = new Loader(this.attr.comparison['geography-error']);
			
			if(!this.cache) this.cache = {};
			if(this.cache[geocode]){
				if(this.cache[geocode].loaded && typeof cb==="function") cb.call(this,geocode);
			}else{
				// Create a loading animation after the <select>
				this.cache[geocode] = {'loaded':false};

				// Load the data from a file
				ODI.ajax('data/'+geocode+'.json',{
					"this": this,
					"geocode": geocode,
					"callback": cb,
					"dataType": "json",
					"success": function(d,a){
						geocode = a.data.geocode;
						this.cache[geocode].loaded = true;
						this.cache[geocode].json = d;
						// Remove the loading animation
						this.loader.geography.remove();
						// Do something
						if(typeof a.data.callback==="function") a.data.callback.call(this,geocode);
					},
					"error": function(e,a){
						this.log('ERROR','Failed to load '+a.url);
						this.loader.geography.error('Failed to load '+geocode);
					}
				});
			}
			return this;
		};
		
		// Use the "Add an organisation" form to add a comparison organisation
		this.addComparison = function(comp){
			this.log('MESSAGE','addComparison',comp);
			var org,div,lvl,date,cur,n,html,cls;
			if(this.attr.comparison.el){
				if(!comp) comp = {};
				
				
				org =  comp.org||this.selected.org||"";
				date = comp.date||this.selected.date||"";
				div = comp.div||this.selected.div||"";
				lvl = comp.lvl||this.selected.lvl||"";
				
				if(!div) div = "_none";
				if(!lvl) lvl = "_none";

				// Check if the values are possible
				if(!this.orgs[org] || !this.orgs[org][div] || !this.orgs[org][div][lvl] || !this.orgs[org][div][lvl][date]){
					this.log('ERROR','The organisation/division/level/date does not seem to exist in the data.',org,div,lvl,date);
					return this;
				}

				if(div == "_none") div = "";
				if(lvl == "_none") lvl = "";

				if(org){
					// Find how many we already have
					cur = this.attr.comparison.el.querySelectorAll('.comparator');
					n = cur.length;
					// Create a new comparison
					comp = document.createElement('div');
					comp.classList.add('comparator');
					comp.classList.add('series-'+n);
					comp.setAttribute('data',n);
					html = '<div class="inner"><button class="close" aria-label="Remove '+formatEmployer(org,div,lvl,date)+'">&times;</button><h3>'+org+'</h3>';
					if(div) html += '<p>'+div+'</p>';
					if(lvl) html += '<p>'+lvl+'</p>';
					if(date) html += '<p>'+date+'</p>';
					html += '</div>';
					comp.innerHTML = html;
					// Add it to the DOM just before the Add button
					this.attr.comparison.el.querySelector('.add').insertAdjacentElement('beforebegin', comp);
					// Add a close event
					cls = comp.querySelector('.close').addEventListener('click',function(e){
						e.preventDefault();
						_obj.removeComparison(parseInt(e.target.closest('.comparator').getAttribute('data')));
					});
					if(n >= (this.attr.comparison.max||3)){
						// Hide adding form
						this.attr.comparison.el.querySelector('.add').style.display = "none";
					}

					// Add comparison to our array
					this.compare.push({'org':org,'div':div||"_none",'lvl':lvl||"_none",'date':date});
				}
			}
			return this;
		};

		this.removeComparisonAll = function(){
			var cur,len,i;
			cur = this.attr.comparison.el.querySelectorAll('.comparator');
			len = cur.length;
			this.log('MESSAGE','removeComparisonAll',cur,len);
			if(len > 1){
				// Remove existing comparisons starting from the end
				for(i = len; i > 1; i--) this.removeComparison(i-1);
			}
			return this;
		};

		// Remove an organisation that has been added as a comparison
		this.removeComparison = function(n){
			this.log('MESSAGE','removeComparison',n);
			var cur,len,c;
			cur = attr.comparison.el.querySelectorAll('.comparator');
			len = cur.length;
			if(len >= 1){
				if(n > 0){
					cur[n].parentNode.removeChild(cur[n]);
					for(c = n+1; c < len; c++){
						// Tidy up 
						cur[c].classList.remove('series-'+c);
						cur[c].classList.add('series-'+(c-1));
						cur[c].setAttribute('data',(c-1));
					}
				}
				len--;
			}

			// Remove the comparison
			this.compare.splice(n,1);

			// Show adding form
			if(len <= (attr.comparison.max||3)) attr.comparison.el.querySelector('.add').style.display = "";
			
			this.update();
			
			if(attr.comparison.add) attr.comparison.add.focus();
			return this;
		};

		this.addData = function(url,d){
			this.log('MESSAGE','addData',url,d);
			var a,b,c,o,p,r,v,d2,pt,total,org,div,lvl,pubdate;

			// Restructure the CSV into JSON
			for(r = 0; r < d.length; r++){
				for(o in d[r]){
					if(o){
						// Convert numbers into numbers
						v = parseFloat(d[r][o]);
						if(typeof v==="number" && v==d[r][o]) d[r][o] = v;
					}
				}
				// Define the data structure
				d2 = JSON.parse(JSON.stringify(this.format));

				total = 0;
				if(!d[r].employees) this.log('ERROR','No employee total given');
				else total = d[r].employees;

				for(p in d[r]){
					if(p){
						pt = p.split(/\_/);
						a = (pt.length >= 1) ? pt[0] : p;
						b = (pt.length >= 2) ? pt[1] : "";
						c = (pt.length >= 3) ? pt[2] : "";
						if(a && typeof d2[a]!=="undefined"){
							if(b && typeof d2[a][b]!=="undefined"){
								if(c && typeof d2[a][b][c]!=="undefined"){
									if(d2[a][b][c].hasOwnProperty('_total')) d2[a][b][c]._total = d[r][p];
									else d2[a][b][c] = d[r][p];
								}else{
									if(d2[a][b].hasOwnProperty('_total')) d2[a][b]._total = d[r][p];
									else d2[a][b] = d[r][p];
								}
								if(!d2[a].total){
									if(total) d2[a].total = total;
									else this.log('WARNING','No total for '+a+' in '+d[r].organisation);
								}else{
									if(!d2[a].total._total){
										d2[a].total._total = total;
									}
								}
							}else{
								this.log('WARNING','Unknown column heading %c'+p+'%c in %c'+d[r].organisation+'%c'+(d[r].organisation_division ? ' / '+d[r].organisation_division:'')+(d[r].organisation_level ? ' / '+d[r].organisation_level:'')+' '+url,'font-style:italic','','font-style:italic','');
							}
						}
					}
				}
				d2.URL = url;
				d2.total = total;
				d[r].data = JSON.parse(JSON.stringify(d2));
				
				org = d[r].organisation;
				div = lvl = "";
				if(org){
					div = d[r].organisation_division||"_none";
					lvl = d[r].organisation_level||"_none";

					if(!this.orgs[org]) this.orgs[org] = {};
					if(!this.orgs[org][div]) this.orgs[org][div] = {};
					if(!this.orgs[org][div][lvl]) this.orgs[org][div][lvl] = {};
					
					pubdate = d[r].published;
					if(pubdate > this.lastupdate) this.lastupdate = pubdate;
	
					this.orgs[org][div][lvl][pubdate] = JSON.parse(JSON.stringify(d2));
				}
			}

			// Store the data
			this.data[url] = d;

			return this;
		};
		
		function addKey(txt,el){
			var key = el.querySelector('.key');
			if(!key){
				key = document.createElement('div');
				key.classList.add('key');
				el.appendChild(key);
			}
			key.innerHTML = txt;
			return true;
		}
		
		this.update = function(){
			
			this.log('MESSAGE','update');
			var fmt,data,dt,sli,gd,pc,keytxt,a,d,e,g,i,n,o,p,r,s;

			fmt = JSON.stringify(this.format);
			data = JSON.parse(fmt);
			
			n = this.compare.length;

			// Loop over data structure turning values into empty arrays
			for(r in data){
				if(r){
					for(p in data[r]){
						if(typeof data[r][p]==="number"){
							data[r][p] = new Array(n);
							for(i=0; i<n; ++i) data[r][p][i] = 0;
						}else{
							if(data[r][p].hasOwnProperty('_total')){
								data[r][p] = new Array(n);
								for(i=0; i<n; ++i) data[r][p][i] = 0;
							}
						}
					}
				}
			}

			// Clear sources
			document.querySelectorAll('#sources ul li.org').forEach(function(e){ e.remove(); });

			// Work out percentages
			for(i = 0; i < this.compare.length; i++){
				o = this.compare[i];
				if(o.org){
					this.compare[i].name = formatEmployer(o.org,o.div,o.lvl,o.date);
					d = this.orgs[o.org][o.div][o.lvl][o.date];
					dt = new Date(o.date);
					sli = document.createElement('li');
					sli.classList.add('org');
					sli.innerHTML = '<a href="'+d.URL+'">'+this.compare[i].name+'</a> updated <time datetime="'+o.date+'">'+dt.toLocaleDateString('en-GB',{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })+'</time>';
					document.querySelector('#sources ul').appendChild(sli);
					for(r in d){
						if(typeof d[r]==="object"){
							for(p in d[r]){
								if(typeof d[r][p]==="number"){
									data[r][p][i] = d[r][p];
								}else{
									if(d[r][p].hasOwnProperty('_total')){
										data[r][p][i] = d[r][p]._total;
									}
								}
							}
						}
					}
				}else{
					if(!this.cache[attr.comparison.geography.value]){
						this.log('ERROR','No geography loaded for '+attr.comparison.geography.value);
						return this;
					}
					if(this.cache[attr.comparison.geography.value].json){
						d = this.cache[this.attr.comparison.geography.value].json.data;
						this.compare[i].name = this.cache[this.attr.comparison.geography.value].json.name;
						for(r in d){
							if(typeof d[r]==="object"){
								for(p in d[r]){
									if(data[r][p]){
										data[r][p][i] = d[r][p];
									}
								}
							}
						}
					}
				}
			}
			var barpanel = {
				'chart':{
					'label':'Barchart',
					'class':'output chart',
					'chart': {
						'type': 'bar',
						'formatY': function(v){
							if(!v) return "0%";
							return v.toFixed(1).replace(/\.0/,"")+'%';
						}
					},
					'events':{
						'barover':function(e,a){
							removeBalloons();
							var info,i,txt;
							info = document.createElement('div');
							info.classList.add('balloon');
							i = (this.data[e.cluster].data[e.series].data) ? this.data[e.cluster].data[e.series].data[e.bin] : this.data[e.cluster].data[e.series];
							txt = i.label+": "+this.data[e.cluster].label+" = "+this.attr.formatY(i.v);
							info.innerHTML = txt;
							e.event.originalTarget.appendChild(info);
							// Update title text
							e.event.originalTarget.setAttribute('title',txt);
						},
						'mouseleave':function(e){
							removeBalloons();
						}
					}
				},
				'table':{'label':'Data','class':'output'}
			};

			this.cards.age.addPanels(barpanel);
			this.cards.carer.addPanels(barpanel);
			this.cards.disability.addPanels(barpanel);
			this.cards.ethnicity.addPanels(barpanel);
			this.cards.gender.addPanels(barpanel);
			this.cards.religion.addPanels(barpanel);
			this.cards.seb.addPanels(barpanel);
			this.cards.sexuality.addPanels(barpanel);
			
			g = {
				'age':{'table':'','th':'','data': []},
				'carer':{'table':'','th':'','data': []},
				'disability':{'table':'','th':'','data': []},
				'ethnicity':{'table':'','th':'','data': []},
				'gender':{'table':'','th':'','data': []},
				'religion':{'table':'','th':'','data': []},
				'seb':{'table':'','th':'','data': []},
				'sexuality':{'table':'','th':'','data': []}
			};

			fmt = JSON.parse(fmt);
			for(s in data){
				if(s=="age" || s=="carer" || s=="disability" || s=="ethnicity" || s=="gender" || s=="religion" || s=="sexuality" || s=="seb"){
					for(i = 0; i < this.compare.length; i++){
						g[s].th += '<th>'+this.compare[i].name+' #</th><th>'+this.compare[i].name+' %</th>';
					}
					for(a in data[s]){
						if(a){
							gd = {'label':(fmt[s][a]._label||a),'data':new Array(this.compare.length)};
							g[s].table += '<tr><td>'+gd.label+'</td>';
							for(i = 0; i < this.compare.length; i++){
								pc = (100*data[s][a][i]/data[s].total[i])||0;
								g[s].table += '<td>'+data[s][a][i]+'</td><td>'+(pc).toFixed(1)+'</td>';
								gd.data[i] = {'v':pc,'label':this.compare[i].name,'class':(a=="prefernottosay" || a=="undisclosed" ? 'prefernottosay':'')};
							}
							g[s].table += '</tr>';
							if(s=="age"){
								if(a!="total" && a!="undisclosed" && a!="prefernottosay") g[s].data.push(gd);
							}else{
								if(a!="total") g[s].data.push(gd);
							}
						}
					}
				}
			}

			keytxt = '<ul>';
			for(i = 0; i < this.compare.length; i++) keytxt += '<li><span class="series-'+i+' key-item"></span> <span class="label">'+(this.compare[i].name)+': '+data.age.total[i].toLocaleString()+' people</span></li>';
			keytxt += '</ul><p class="extranotes"></p>';


			if(g.age.table){
				this.cards.age.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Age bracket</th>'+g.age.th+'</tr>'+g.age.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.log('MESSAGE','Data',g.age.data);
				this.cards.age.chart.setData(g.age.data).draw();
				for(e in this.cards.age.panels.chart.events){
					if(e) this.cards.age.chart.on(e,this.cards.age.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.age.panels.chart.el);
				//key.querySelector('.extranotes').innerHTML = (employees>data.age.total.n.total ? '<p>There are '+(employees-data.age.total.n.total).toLocaleString()+' employees without age data':'');
			}
			if(g.carer.table){
				this.cards.carer.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Carer status</th>'+g.carer.th+'</tr>'+g.carer.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.carer.chart.setData(g.carer.data).draw();
				for(e in this.cards.carer.panels.chart.events){
					if(e) this.cards.carer.chart.on(e,this.cards.carer.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.carer.panels.chart.el);
				//key.querySelector('.extranotes').innerHTML = (employees>data.carer.total.n.total ? '<p>There are '+(employees-data.carer.total.n.total).toLocaleString()+' employees without carer data':'');
			}
			if(g.disability.table){
				this.cards.disability.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Disability status</th>'+g.disability.th+'</tr>'+g.disability.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.disability.chart.setData(g.disability.data).draw();
				for(e in this.cards.disability.panels.chart.events){
					if(e) this.cards.disability.chart.on(e,this.cards.disability.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.disability.panels.chart.el);
			}
			if(g.ethnicity.table){
				this.cards.ethnicity.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Ethnicity</th>'+g.ethnicity.th+'</tr>'+g.ethnicity.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.ethnicity.chart.setData(g.ethnicity.data).draw();
				for(e in this.cards.ethnicity.panels.chart.events){
					if(e) this.cards.ethnicity.chart.on(e,this.cards.ethnicity.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.ethnicity.panels.chart.el);
			}
			if(g.gender.table){
				this.cards.gender.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Gender</th>'+g.gender.th+'</tr>'+g.gender.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.gender.chart.setData(g.gender.data).draw();
				for(e in this.cards.gender.panels.chart.events){
					if(e) this.cards.gender.chart.on(e,this.cards.gender.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.gender.panels.chart.el);
			}
			if(g.religion.table){
				this.cards.religion.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Religion</th>'+g.religion.th+'</tr>'+g.religion.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.religion.chart.setData(g.religion.data).draw();
				for(e in this.cards.religion.panels.chart.events){
					if(e) this.cards.religion.chart.on(e,this.cards.religion.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.religion.panels.chart.el);
			}
			if(g.sexuality.table){
				this.cards.sexuality.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Sexuality</th>'+g.sexuality.th+'</tr>'+g.sexuality.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.sexuality.chart.setData(g.sexuality.data).draw();
				for(e in this.cards.sexuality.panels.chart.events){
					if(e) this.cards.sexuality.chart.on(e,this.cards.sexuality.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.sexuality.panels.chart.el);
			}
			if(g.seb.table){
				this.cards.seb.panels.table.el.innerHTML = '<table class="table-sort"><tr><th>Sexuality</th>'+g.seb.th+'</tr>'+g.seb.table+'</table><p>Percentages are rounded in the table so may not add up to 100%. Clicking on a column heading will sort the table by that column.</p>';
				this.cards.seb.chart.setData(g.seb.data).draw();
				for(e in this.cards.seb.panels.chart.events){
					if(e) this.cards.seb.chart.on(e,this.cards.seb.panels.chart.events[e]);
				}
				addKey(keytxt,this.cards.seb.panels.chart.el);
			}
			
			// Make tables sortable
			if(typeof root.tableSortJs==="function") root.tableSortJs();

			// Update numbers
			document.querySelector('.lastupdated').innerHTML = (new Date(this.lastupdate).toLocaleDateString('en-GB',{ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
		//	document.querySelector('#population .number').innerHTML = (this.cache[this.attr.comparison.geography.value].json.data.age.total||0).toLocaleString();
			document.querySelector('#organisations .number').innerHTML = Object.keys(_obj.orgs).length;

			return this;
		};

		return this.init(attr);
	}

	function removeBalloons(){
		var b = document.querySelectorAll('.balloon');
		if(b) b.forEach(function(e){ e.remove(); });
		return;
	}
	
	//var dash = new Dashboard();
	ODI.diversityDashboard = Dashboard;

	root.ODI = ODI;
	
})(window || this);
