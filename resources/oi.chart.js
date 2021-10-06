(function(root){

	if(!root.OI) root.OI = {};

	var G = {};
	if(typeof Object.extend === 'undefined'){
		G.extend = function(destination, source) {
			for(var property in source) {
				if(source.hasOwnProperty(property)) destination[property] = source[property];
			}
			return destination;
		};
	}else G.extend = Object.extend;

	var chartcounter = 0;

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

	function Chart(target,attr){
		var ver = "0.1.1";
		if(!target) return {};
		this.target = target;
		this.attr = attr || {};
		this.events = {resize:""};

		if(attr.type=="bar") this.chart = new BarChart(target,this);

		this.version = function(){ return ver; };
		this.id = chartcounter;
	
		this.setData = function(d){
			this.data = d;
			return this;
		};

		this.draw = function(){
			if(this.chart && typeof this.chart.draw==="function") this.chart.draw();
			return this;
		};

		chartcounter++;
		return this;
	}
	
	// Attach a handler to an event for the Graph object in a style similar to that used by jQuery
	//   .on(eventType[,eventData],handler(eventObject));
	//   .on("resize",function(e){ console.log(e); });
	//   .on("resize",{me:this},function(e){ console.log(e.data.me); });
	Chart.prototype.on = function(ev,e,fn){
		if(typeof ev!="string") return this;
		if(typeof fn=="undefined"){ fn = e; e = {}; }
		else{ e = {data:e}; }
		if(typeof e!="object" || typeof fn!="function") return this;
		if(this.events[ev]) this.events[ev].push({e:e,fn:fn});
		else this.events[ev] = [{e:e,fn:fn}];

		return this;
	};

	Chart.prototype.off = function(ev){
		if(typeof ev != "string") return this;
		if(typeof this.events[ev]=="object") this.events[ev] = [];
		return this;
	};

	// Trigger a defined event with arguments. This is for internal-use to be 
	// sure to include the correct arguments for a particular event
	Chart.prototype.trigger = function(ev,args){
		if(typeof ev != "string") return;
		if(typeof args != "object") args = {};
		var o = [];
		if(typeof this.events[ev]=="object"){
			for(var i = 0 ; i < this.events[ev].length ; i++){
				var e = G.extend(this.events[ev][i].e,args);
				if(typeof this.events[ev][i].fn == "function") o.push(this.events[ev][i].fn.call(e['this']||this,e));
			}
		}
		if(o.length > 0) return o;
	};

	Chart.prototype.formatNumber = function(v){
		if(typeof v !== "number") return v;
		if(v >= 1e11) return Math.round(v/1e9)+"B";
		if(v >= 1e10) return (v/1e9).toFixed(1).replace(/\.?0+$/,"")+"B";
		if(v >= 1e9) return (v/1e9).toFixed(2).replace(/\.?0+$/,"")+"B";
		if(v >= 1e8) return Math.round(v/1e6)+"M";
		if(v >= 1e7) return (v/1e6).toFixed(1).replace(/\.0*$/,"")+"M";
		if(v >= 1e6) return (v/1e6).toFixed(2).replace(/\.0*$/,"")+"M";
		if(v >= 1e5) return Math.round(v/1e3)+"k";
		if(v >= 1e4) return Math.round(v/1e3)+"k";
		// Remove rounding issues
		return (''+v).replace(/0{5,}1$/,"");
	};

	function BarChart(target,_obj){
		this.el = target;
		this.attr = _obj.attr || {};
		this.events = {resize:""};
		this.attr.formatX = (typeof _obj.attr.formatX==="undefined") ? function(key){ return key; } : _obj.attr.formatX;
		this.attr.formatY = (typeof _obj.attr.formatY==="undefined") ? function(v){ return v; } : _obj.attr.formatY;
		this.attr.formatBar = (typeof this.attr.formatBar==="undefined") ? function(key,val,series){ return ""; } : _obj.attr.formatBar;
		this.parent = (typeof this.attr.parent==="undefined") ? _obj : _obj.attr.parent;

		this.drawn = false;
		this.max = this.attr.max || undefined;
		this.min = this.attr.min || undefined;
		this.inc = this.attr.inc || undefined;
		this.mintick = this.attr.mintick || 3;
		this.bin = (typeof this.attr.bin==="function") ? this.attr.bin : function(v){ return (this.typ==="string" ? this.fields[v] : Math.floor((v - this.min)/this.inc)); };
		return this;
	}


	BarChart.prototype.draw = function(){

		if(!this.el || !this.parent.data) return this;
		var d,nc,ns,nb,clusters,b,c,g,h,i,o,p,r,s,v,mx,mn,el,grid,output,key,nval,_parent,columns,series,l,hbot,htop,hbar,wbar,lbar,value,cls,lbls,lh,_obj;

		d = this.parent.data;
		if(typeof d!=="object"){
			console.error('data is not an object');
			return this;
		}

		// Build the basic graph structure
		el = this.el.querySelector('.barchart');
		if(!el){
			this.el.innerHTML = '<div class="barchart"><div class="barchart-grid"></div><div class="barchart-data"></div><div style="clear:both;"></div></div>';
			el = this.el.querySelector('.barchart');
			// Add events to main chart area
			_parent = this.parent;
			this.el.addEventListener('mouseleave',function(e){ e.preventDefault(); _parent.trigger("mouseleave",{event:e}); });
			this.el.addEventListener('mouseover',function(e){ e.preventDefault(); _parent.trigger("mouseover",{event:e}); });
		}
		if(this.attr.dir=="horizontal") el.classList.add('horizontal');
		else el.classList.remove('horizontal');

		// The number of clusters
		if(typeof d.length!=="number"){
			d = [d];
		}
		nc = d.length;
		ns = 0;

		// Need to loop over clusters, loop over stacks and find min/max
		mx = 0;
		mn = (this.attr.ymin) ? this.attr.ymin : 0;
		// For each cluster
		for(c = 0 ; c < d.length; c++){
			if(d[c].data){
				ns = Math.max(d[c].data.length,ns);
				// For each series
				v = 0;
				for(s = 0; s < d[c].data.length; s++){
					if(typeof d[c].data[s].v==="number"){
						if(d[c].stacked) v += d[c].data[s].v;
						else v = d[c].data[s].v;
					}
					// Find max and min values
					mx = Math.max(mx,v);
					mn = Math.min(mn,v);
				}
			}else{
				console.warn('No data for cluster '+c);
			}
		}
		r = mx-mn;
		if(r == 0) r = 1; // Fix for zero range

		// Set number of columns
		el.querySelector('.barchart-data').style['grid-template-'+(this.attr.dir=="horizontal" ? 'rows':'columns')] = 'repeat('+nc+',1fr)';

		// Set the height of the graph
		h = 100;

		// Draw the grid
		if(this.attr.ymax && this.attr.ymax > mx) mx = this.attr.ymax;
		grid = this.getGrid(mn,mx);
		
		if(!this.grid) this.grid = {};
		for(g in this.grid) this.grid[g].keep = false;
		for(g = 0; g <= grid.max; g+= grid.inc){
			if(!this.grid[g]) this.grid[g] = {};
			this.grid[g].keep = true;
			this.grid[g].value = g;
		}
		bgrid = el.querySelector('.barchart-grid');
		for(g in this.grid){
			if(!this.grid[g].keep){
				// Remove this grid line
				bgrid.removeChild(this.grid[g].el);
				delete this.grid[g];
			}else{
				if(!this.grid[g].el){
					// Add this grid line
					line = document.createElement('div');
					line.classList.add('line');
					line.innerHTML = '<span>'+(typeof this.attr.formatY==="function" ? this.attr.formatY.call(this,this.grid[g].value) : this.formatNumber(this.grid[g].value))+'</span>';
					bgrid.appendChild(line);
					this.grid[g].el = line;
				}
				this.grid[g].el.style[(this.attr.dir=="horizontal" ? 'left':'bottom')] = (h*(this.grid[g].value-mn)/r).toFixed(4)+'%';
			}
		}

		clusters = el.querySelectorAll('.barchart-cluster-inner');

		if(!clusters || clusters.length != nc){
			o = el.querySelector('.barchart-data');
			o.innerHTML = "";
			clusters = new Array(d.length);

			for(c  = 0 ; c < d.length; c++){
				cat = document.createElement('div');
				cat.classList.add('barchart-cluster');
				// Set number of columns for this category
				
				cat.innerHTML = '<div class="barchart-cluster-inner"></div>';// style="grid-template-'+(this.attr.dir=="horizontal" ? 'rows':'columns')+':repeat('+ns+',1fr)"></div>';
				cluster = cat.querySelector('.barchart-cluster-inner');
				//cluster.style['grid-template-'+(this.attr.dir=="horizontal" ? 'rows':'columns')] = 'repeat('+ns+',1fr)';
				cat.setAttribute('data-cluster',c);
				_parent = this.parent;
				cat.addEventListener('click',function(e){
					e.preventDefault();
					_parent.trigger("clusterclick",{event:e});
				});
				cat.addEventListener('mouseover',function(e){
					e.preventDefault();
					_parent.trigger("clusterover",{event:e});
				});
				o.appendChild(cat);
				clusters[c] = cluster;
			}
		}

		_obj = this;

		// Loop over clusters
		for(c = 0 ; c < d.length; c++){
			series = clusters[c].querySelectorAll('.barchart-series-inner');
			if(!series || series.length != ns){
				series = [];
				clusters[c].innerHTML = "";

				// Make cluster label
				l = document.createElement('span');
				l.classList.add('category-label');
				l.innerHTML = (typeof this.attr.formatX==="function" ? this.attr.formatX.call(this,d[c].label) : d[c].label);
				clusters[c].appendChild(l);

				// Add series
				if(d[c].data){
					for(s = 0; s < d[c].data.length; s++){
						if(d[c].stacked && s==0 || !d[c].stacked){
							b = document.createElement('div');
							b.classList.add('barchart-series');
							if(d[c].data[s]['class']) b.classList.add(d[c].data[s]['class'])
							b.setAttribute('data-cluster',c);
							b.setAttribute('data-series',s);
							
						}
						// Create inner
						i = document.createElement('div');
						i.classList.add('barchart-series-inner');
						i.classList.add('series-'+s);
						if(d[c].data[s]['class']) i.classList.add(d[c].data[s]['class'])
						i.setAttribute('data-cluster',c);
						i.setAttribute('data-series',s);
						i.addEventListener('focus',function(e){
							e.preventDefault();
							e.currentTarget = e.currentTarget.parentNode;
							_obj.parent.trigger("barover",{'event':e,'cluster':parseInt(e.currentTarget.getAttribute('data-cluster')),'series':parseInt(e.currentTarget.getAttribute('data-series'))});
						});
						i.addEventListener('mouseover',function(e){
							e.preventDefault();
							e.stopPropagation();
							e.currentTarget = e.currentTarget.parentNode;
							_obj.parent.trigger("barover",{'event':e,'cluster':parseInt(e.currentTarget.getAttribute('data-cluster')),'series':parseInt(e.currentTarget.getAttribute('data-series'))});
						});
						i.addEventListener('click',function(e){
							e.preventDefault();
							e.currentTarget = e.currentTarget.parentNode;
							_obj.parent.trigger("barclick",{'event':e,'cluster':parseInt(e.currentTarget.getAttribute('data-cluster')),'series':parseInt(e.currentTarget.getAttribute('data-series'))});
						});
						b.appendChild(i);
						clusters[c].appendChild(b);
						series.push(i);
					}
				}else{
					console.warn('No data for cluster '+c,d[c]);
				}
			}

			v = mn;
			var splits = "";
			var dir = "";
			for(s = 0; s < d[c].data.length; s++){

				if(d[c].stacked) v += d[c].data[s].v;
				else v = d[c].data[s].v;

				hbot = (100*(v-mn))/r;
				htop = 100-hbot;
				hbar = 100*(d[c].data[s].v-mn)/r;
				wbar = (d[c].stacked ? 100 : 100/ns);
				lbar = (d[c].stacked ? 0 : 100*s/ns);
				key = d[c].data[s].label;
				value = d[c].data[s].v;
				// Set class
				if(typeof this.attr.formatBar==="function"){
					cls = this.attr.formatBar.call(this,key,value).split(/ /);
					if(cls.length == 1 && cls[0]=="") cls = [];
					for(cl = 0; cl < cls.length; cl++) series[s].classList.add(cls[cl]);
				}
				// Set attributes
				series[s].setAttribute('title',key+': '+(typeof this.attr.formatY==="function" ? this.attr.formatY.call(this,value) : this.parent.formatNumber(value)));
				series[s].setAttribute('tabindex',0);
				//series[s].setAttribute('data-bin',i);
				series[s].setAttribute('data-series',s);
				// Set style
				if(this.attr.dir=="horizontal"){
					series[s].style.width = hbar+"%";
					series[s].style.right = htop+"%";
					//series[s].style.top = lbar+"%";
					//series[s].style.height = wbar+"%";
					//splits += hbar+"%";
					if(htop+(hbar/2) < 50) series[s].classList.add('bar-right');
					dir = (d[c].stacked ? "columns" : "rows");
				}else{
					series[s].style.height = hbar+"%";
					series[s].style.top = htop+"%";
					splits += wbar+"%";
					if(c > d.length/2) series[s].classList.add('bar-right');
					dir = (d[c].stacked ? "rows" : "columns");
				}
			}
			clusters[c].style['grid-template-'+dir] = 'repeat('+d[c].data.length+',1fr)';
			//clusters[c].style['-ms-grid-'+(dir)] = '(1fr)['+d[c].data.length+']';
		}

		// Get the maximum label height
		lbls = el.querySelectorAll('.barchart-data .category-label');
		lh = 0;
		for(i = 0 ; i < lbls.length; i++){
			lh = Math.max(lh,(_obj.attr.dir=="horizontal" ? lbls[i].offsetWidth-parseInt(getStyle(lbls[i],'left')) : lbls[i].offsetHeight));
		}
		// If we haven't got a value the element may be hidden so we'll guess a value
		if(lh == 0) lh = parseInt(getStyle(lbls[0],'line-height'))+parseInt(getStyle(lbls[0],'padding-top'));
		// Padding for labels
		el.querySelector('.barchart-grid').style["margin-"+(this.attr.dir=="horizontal" ? "left":"bottom")] = lh+"px";
		el.querySelector('.barchart-data').style["margin-"+(this.attr.dir=="horizontal" ? "left":"bottom")] = lh+"px";

		return this;
	};

	BarChart.prototype.getGrid = function(mn,mx,mintick){
		var rg = mx-mn;
		var base = 10;
		if(!mintick) mintick = 3;
		var t_inc = Math.pow(base,Math.floor(Math.log(rg)/Math.log(base)));
		t_inc *= 2;
		var t_max = (Math.floor(mx/t_inc))*t_inc;
		if(t_max < mx) t_max += t_inc;
		var t_min = t_max;
		var i = 0;
		do {
			i++;
			t_min -= t_inc;
		}while(t_min > mn);

		// Test for really tiny values that might mess up the calculation
		if(Math.abs(t_min) < 1E-15) t_min = 0.0;

		// Add more tick marks if we only have a few
		while(i < mintick) {
			t_inc /= 2.0;
			if((t_min + t_inc) <= mn) t_min += t_inc;
			if((t_max - t_inc) >= mx) t_max -= t_inc ;
			i = i*2;
		}
		// We don't want an empty bin at the top end of the range
		if(t_max > mx) t_max -= t_inc;
		return {'min':t_min,'max':t_max,'inc':t_inc,'range':t_max-t_min};
	};
	
	OI.chart = Chart;

})(window || this);