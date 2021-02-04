(function(root){

	if(!root.ODI) root.ODI = {};

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

	function Chart(target,attr){
		var ver = "0.1.0";
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
				if(typeof this.events[ev][i].fn == "function") o.push(this.events[ev][i].fn.call(this,e));
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
		this.attr.units = (typeof _obj.attr.units==="undefined") ? "" : _obj.attr.units;
		this.attr.formatX = (typeof _obj.attr.formatX==="undefined") ? (typeof _obj.attr.formatKey==="function" ? _obj.attr.formatKey : function(key){ return key; }) : _obj.attr.formatX;
		this.attr.formatY = (typeof _obj.attr.formatY==="undefined") ? function(v){ return _obj.attr.units+v; } : _obj.attr.formatY;
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
		var nseries,b,c,g,h,i,o,p,r,s,v,mx,mn,el,grid,output,key,nval,_parent,columns,bits,l,hbot,htop,hbar,wbar,lbar,value,cls,lbls,lh;

		nseries = this.parent.data.series.length;

		if(nseries > 0){

			nval = this.parent.data.series[0].data.length;

			el = this.el.querySelector('.barchart');
			// Build the basic graph structure
			if(!el){
				this.el.innerHTML = '<div class="barchart"><div class="barchart-grid"></div><div class="barchart-data"></div><div style="clear:both;"></div></div>';
				el = this.el.querySelector('.barchart');
				// Add events to main chart area
				_parent = this;
				this.el.addEventListener('mouseleave',function(e){ e.preventDefault(); _parent.trigger("mouseleave",{event:e}); });
				this.el.addEventListener('mouseover',function(e){ e.preventDefault(); _parent.trigger("mouseover",{event:e}); });
			}
			// Set number of columns
			el.querySelector('.barchart-data').style['grid-template-columns'] = 'repeat('+nval+',1fr)';

			// Set the height of the graph
			h = 100;

			// Find the min/max values
			mx = 0;
			mn = (this.attr.ymin) ? this.attr.ymin : 0;
			for(i = 0; i < nval; i++){
				v = 0;
				for(s = 0; s < nseries; s++){
					if(this.attr.stacked) v += this.parent.data.series[s].data[i];	// Add series values
					else v = Math.max(v,this.parent.data.series[s].data[i]);	// Find maximum series value
				}
				// Find max and min values
				mx = Math.max(mx,v);
				mn = Math.min(mn,v);
			}

			r = mx-mn;
			// Fix for zero range
			if(r == 0) r = 1;

			// Draw the grid
			if(this.attr.ymax && this.attr.ymax > mx) mx = this.attr.ymax;
			grid = this.getGrid(mn, mx);
			output = "";

			for(g = 0; g <= grid.max; g+= grid.inc) output += '<div class="line" style="bottom:'+(h*(g-mn)/r).toFixed(4)+'%;"><span>'+(typeof this.attr.formatY==="function" ? this.attr.formatY.call(this,g,{'units':this.attr.units}) : (this.attr.units || "")+this.formatNumber(g))+'</span></div>';
			this.el.querySelector('.barchart-grid').innerHTML = output;

			columns = el.querySelectorAll('.barchart-column');
			if(!columns || columns.length != nval){
				o = el.querySelector('.barchart-data');
				o.innerHTML = "";
				columns = [];
				for(i = 0; i < nval; i++){
					c = document.createElement('div');
					c.classList.add('barchart-column');
					c.innerHTML = '';
					c.setAttribute('data-bin',i);
					_parent = this.parent;
					c.addEventListener('click',function(e){
						e.preventDefault();
						_parent.trigger("columnclick",{event:e,bin:parseInt(e.currentTarget.getAttribute('data-bin'))});
					});
					c.addEventListener('mouseover',function(e){
						e.preventDefault();
						_parent.trigger("columnover",{event:e,bin:parseInt(e.currentTarget.getAttribute('data-bin'))});
					});
					o.appendChild(c);
					columns.push(c);
				}
			}

			_obj = this;

			// Loop over columns
			for(i = 0; i < nval; i++){
				bits = columns[i].querySelectorAll('.bar');
				if(!bits || bits.length != nseries){
					bits = [];
					columns[i].innerHTML = "";
					for(s = 0; s < nseries; s++){
						b = document.createElement('div');
						b.classList.add('bar');
						b.classList.add('series-'+s);
						b.setAttribute('data-bin',i);
						b.setAttribute('data-series',s);

						b.addEventListener('focus',function(e){
							e.preventDefault();
							e.currentTarget = e.currentTarget.parentNode;
							e['this'] = _obj.parent;
							_obj.parent.trigger("barover",{event:e,bin:parseInt(e.currentTarget.getAttribute('data-bin')),series:parseInt(e.currentTarget.getAttribute('data-series'))});
						});
						b.addEventListener('mouseover',function(e){
							e.preventDefault();
							e.stopPropagation();
							e.currentTarget = e.currentTarget.parentNode;
							e['this'] = _obj.parent;
							_obj.parent.trigger("barover",{event:e,bin:parseInt(e.currentTarget.getAttribute('data-bin')),series:parseInt(e.currentTarget.getAttribute('data-series'))});
						});
						b.addEventListener('click',function(e){
							e.preventDefault();
							e.currentTarget = e.currentTarget.parentNode;
							e['this'] = _obj.parent;
							_obj.parent.trigger("barclick",{event:e,bin:parseInt(e.currentTarget.getAttribute('data-bin')),series:parseInt(e.currentTarget.getAttribute('data-series'))});
						});
						columns[i].appendChild(b);
						bits.push(b);
					}
					l = document.createElement('span');
					l.classList.add('category-label');
					l.innerHTML = (typeof this.attr.formatX==="function" ? this.attr.formatX.call(this,this.parent.data.labels[i]) : this.parent.data.labels[i]);
					columns[i].append(l);
				}

				v = mn;
				for(s = 0; s < nseries; s++){
					if(this.attr.stacked){
						v += this.parent.data.series[s].data[i];
					}else{
						v = this.parent.data.series[s].data[i];
					}
					hbot = (100*(v-mn))/r;
					htop = 100-hbot;
					hbar = 100*(this.parent.data.series[s].data[i]-mn)/r;
					wbar = (this.attr.stacked ? 100 : 100/nseries);
					lbar = (this.attr.stacked ? 0 : 100*s/nseries);
					key = this.parent.data.series[s].label;
					value = this.parent.data.series[s].data[i];
					// Set class
					if(typeof this.attr.formatBar==="function"){
						cls = this.attr.formatBar.call(this,key,value).split(/ /);
						if(cls.length == 1 && cls[0]=="") cls = [];
						for(c = 0; c < cls.length; c++) bits[s].classList.add(cls[c]);
					}
					// Set attributes
					bits[s].setAttribute('title',key+': '+(this.attr.units || "")+this.parent.formatNumber(value));
					bits[s].setAttribute('data-bin',i);
					bits[s].setAttribute('data-series',s);
					// Set style
					bits[s].style.height = hbar+"%";
					bits[s].style.top = htop+"%";
					bits[s].style.left = lbar+"%";
					bits[s].style.width = wbar+"%";
				}
			}

			// Get the maximum label height
			lbls = el.querySelectorAll('.barchart-data .category-label');
			lh = 0;
			lbls.forEach(function(e){ lh = Math.max(lh,e.offsetHeight); });
			// Padding for labels
			el.querySelector('.barchart-grid').style["margin-bottom"] = lh+"px";
			el.querySelector('.barchart-data').style["margin-bottom"] = lh+"px";

		}
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
	
	ODI.chart = function(target,attr){ return new Chart(target,attr); };

})(window || this);