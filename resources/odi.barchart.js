/*
	Create very simple horizontal bar charts using SVG
	(c) Stuart Lowe, ODI Leeds 2020
*/
(function(root){

	if(!root.ODI) root.ODI = {};

	var svgcounter = 0;

	/* SVG Builder */
	function SVG(el){
		if(!el) return this;
		this.version = "0.2";
		this.canvas = el;
		this.w = this.canvas[0].offsetWidth;
		this.h = this.canvas[0].offsetHeight;
		this.id = this.canvas.getAttribute();
		
		this.canvas.html('<svg height="'+this.h+'" version="1.1" width="'+this.w+'" viewBox="0 0 '+this.w+' '+this.h+'" xmlns="http://www.w3.org/2000/svg"><desc>Created by stuQuery SVG</desc></svg>');
		this.paper = S(this.canvas.find('svg')[0]);

		// Initialise
		this.nodes = new Array();
		this.clippaths = new Array();
		this.patterns = new Array();
		
		function Path(path){
			this.path = path;
			this.p = path;
			
			if(typeof path==="string"){
				this.path = path;
				this.p = path;
				var c;
				this.p += '0';
				this.p = this.p.match(/(^|[A-Za-z]| )[^ A-Za-z]+/g);
				var a = this.p[this.p.length-1];
				this.p[this.p.length-1] = a.substring(0,a.length-1);
				for(var i = 0; i < this.p.length; i++){
					if(this.p[i].search(/[A-Za-z]/) == 0){
						c = this.p[i][0];
						this.p[i] = this.p[i].substr(1);
					}else{
						if(this.p[i][0] == ' ') this.p[i] = this.p[i].substr(1);
						c = '';
					}
					this.p[i] = [c,this.p[i].split(/\,/)];
					if(this.p[i][1].length == 2){
						for(var j = 0; j < this.p[i][1].length; j++) this.p[i][1][j] = parseFloat(this.p[i][1][j]);
					}else{
						this.p[i][1] = [];
					}
				}
			}else{
				this.p = path;
				this.path = this.string(path);
			}
			return this;
		}
		Path.prototype.string = function(){
			var str = '';
			for(var i = 0; i < this.p.length; i++){
				str += ((this.p[i][0]) ? this.p[i][0] : ' ')+(this.p[i][1].length > 0 ? this.p[i][1].join(',') : ' ');
			}
			return str;
		}
		function copy(o) {
			var out, v, key;
			out = Array.isArray(o) ? [] : {};
			for (key in o) {
				v = o[key];
				out[key] = (typeof v === "object") ? copy(v) : v;
			}
			return out;
		}
		Path.prototype.copy = function(){
			return new Path(copy(this.p));
		}
		function Node(inp){
			this.transforms = [];
			// Make a structure to hold the original properties
			this.orig = {};
			this.events = new Array();
			for(var i in inp) this[i] = inp[i];
			for(var i in inp) this.orig[i] = inp[i];
			if(this.path){
				this.path = new Path(this.path);
				this.d = this.path.string();
				this.orig.path = this.path.copy();
				this.orig.d = this.d;
			}
			return this;
		}
		Node.prototype.on = function(type,attr,fn){
			if(!fn && typeof attr==="function"){
				fn = attr;
				attr = {};
			}
			this.events.push({'type':type,'attr':attr,'fn':fn});
			return this;
		}
		Node.prototype.attr = function(attr,arg){
			if(arg){ attr = {}; attr[attr] = arg; }
			if(!this.attributes) this.attributes = {};
			if(!this.el || this.el.length == 0) this.el = S('#'+this.id);
			for(a in attr){
				if(typeof attr[a]==="string") attr[a] = attr[a].replace(/\"/g,"\'");
				this.attributes[a] = attr[a];
				this.el.attr(a,attr[a]);
			}
			this.orig.attributes = JSON.parse(JSON.stringify(this.attributes));
			return this;
		}
		Node.prototype.transform = function(ts){
			if(typeof ts.length==="undefined" && typeof ts==="object") ts = [ts];
			if(!this.transforms) this.transforms = [];
			for(var t = 0; t < ts.length; t++) this.transforms.push(ts[t]);
			return this;
		}
		Node.prototype.update = function(){
			//console.log('update',this.type,this.transforms)
			if(this.transforms && this.transforms.length > 0){

				// Reset path
				if(this.orig.path) this.path = this.orig.path.copy();
				
				// Loop over all the transforms and update properties
				for(var t = 0; t < this.transforms.length; t++){
					for(var p in this.transforms[t].props){
						// Replace the current value with the original
						if(this.orig[p] && this[p]) this[p] = JSON.parse(JSON.stringify(this.orig[p]));
					}
				}
				// Update attributes to the original ones
				if(this.orig.attributes) this.attributes = JSON.parse(JSON.stringify(this.orig.attributes));

				for(var t = 0; t < this.transforms.length; t++){
					if(this.transforms[t].type=="scale"){
						if(this.type == "path"){
							for(var i = 0; i < this.orig.path.p.length; i++){
								for(var j = 0; j < this.orig.path.p[i][1].length; j++){
									this.path.p[i][1][j] *= this.transforms[t].props[(j%2==0 ? "x": "y")];
								}
							}
							this.path.path = this.path.string();
							this.d = this.path.path;
						}else{
							for(var p in this.transforms[t].props){
								if(this[p]) this[p] *= this.transforms[t].props[p];
							}
						}
						if(this.attributes){
							for(var p in this.transforms[t].props){
								if(this.attributes[p]) this.attributes[p] *= this.transforms[t].props[p];
							}
						}
					}
				}
			}
			return this;
		}
		this.circle = function(x,y,r){
			this.nodes.push(new Node({'cx':x,'cy':y,'r':r,'type':'circle'}));
			return this.nodes[this.nodes.length-1];
		}
		this.rect = function(x,y,w,h,r){
			if(r) this.nodes.push(new Node({'x':x,'y':y,'width':w,'height':h,'r':r,'rx':r,'ry':r,'type':'rect'}));
			else this.nodes.push(new Node({'x':x,'y':y,'width':w,'height':h,'type':'rect'}));
			return this.nodes[this.nodes.length-1];
		}
		this.path = function(path){
			this.nodes.push(new Node({'path':path,'type':'path'}));
			return this.nodes[this.nodes.length-1];
		}
		this.text = function(x,y,text){
			this.nodes.push(new Node({'x':x,'y':y,'type':'text','text':text}));
			return this.nodes[this.nodes.length-1];
		}
		this.clip = function(o){
			this.clippaths.push(new Node(o));
			return this.clippaths[this.clippaths.length-1];
		}
		this.pattern = function(o){
			this.patterns.push(o);
			return this.patterns[this.patterns.length-1];
		}

		return this;
	}
	SVG.prototype.clear = function(){
		this.nodes = new Array();
		this.clippaths = new Array();
		this.patterns = new Array();
		this.draw();
		return this;
	}
	SVG.prototype.draw = function(head){
		var dom = "<desc>Created by stuQuery SVG</desc>";
		if(this.patterns.length > 0){
			var m,ok,done;
			done = {};
			for(var i = 0; i < this.patterns.length; i++){
				m = this.patterns[i].match(/id="([^\"]+)"/);
				ok = true;
				if(m.length > 0){
					if(done[m[1]]) ok = false;
					done[m[1]] = true;
				}
				if(ok) dom += this.patterns[i];
			}
		}
		if(this.clippaths.length > 0){
			dom += '<defs>';
			for(var i = 0; i < this.clippaths.length; i++){
			
				dom += '<clipPath id="'+this.clippaths[i].id+'">';
				if(this.clippaths[i].type){
					// Update node with any transforms
					this.clippaths[i].update();
					dom += '<'+this.clippaths[i].type;
					// Add properties
					for(var j in this.clippaths[i]){
						if(j != "type" && typeof this.clippaths[i][j]!=="object" && typeof this.clippaths[i][j]!=="function" && j != "attributes"){
							dom += ' '+j+'="'+this.clippaths[i][j]+'"';
						}
					}
					dom += ' />';
				}
				dom += '</clipPath>';
			}
			dom += '</defs>';
		}

		for(var i = 0; i < this.nodes.length; i++){
			var t = this.nodes[i].type;
			var arr = (this.nodes[i].text) ? this.nodes[i].text.split(/\n/) : [];
			if(!this.nodes[i].id) this.nodes[i].id = this.id+'-svg-node-'+i;
			// Set the ID if we've been given one
			if(this.nodes[i].attributes && this.nodes[i].attributes['id']) this.nodes[i].id = this.nodes[i].attributes['id'];

			if(this.nodes[i].type){
				dom += '<'+t;
				// Update node with any transforms
				this.nodes[i].update();
				// Add properties
				for(var j in this.nodes[i]){
					if(j != "type" && typeof this.nodes[i][j]!=="object" && typeof this.nodes[i][j]!=="function" && j != "attributes") dom += ' '+j+'="'+this.nodes[i][j]+'"';
				}
				dom += ' id="'+this.nodes[i].id+'"';
				// Add attributes
				for(var a in this.nodes[i].attributes) dom += ' '+a+'="'+(a == "clip-path" ? 'url(#':'')+this.nodes[i].attributes[a]+(a == "clip-path" ? ')':'')+'"';
				// Draw internal parts of a text elements
				if(this.nodes[i].text){
					var y = 0;
					var lh = 1.2;
					dom += '>';
					var off = -0.5 + arr.length*0.5;
					for(var a = 0; a < arr.length; a++, y+=lh){
						dom += '<tspan'+(a==0 ? ' dy="-'+(lh*off)+'em"':' x="'+this.nodes[i].x+'" dy="'+lh+'em"')+'>'+arr[a]+'</tspan>';
					}
					dom += '</'+t+'>';
				}else dom += ' />';
			}
		}
		this.paper.html(dom);

		// Attach events to DOM
		for(var i = 0; i < this.nodes.length; i++){
			if(this.nodes[i].events){
				for(var e = 0; e < this.nodes[i].events.length; e++){
					S('#'+this.nodes[i].id).on(this.nodes[i].events[e].type,this.nodes[i].events[e].attr,this.nodes[i].events[e].fn);
				}
			}
		}

		return this;
	}

	function SVGBarChart(el,attr){
console.log(el,attr);
		if(!attr) attr = {};
		// Set the height
		if(attr.height) el.find('.barchart').css({'height':attr.height+'px'});
		if(!attr.label) attr.label = {};
		if(!attr.label.format) attr.label.format = function(i,cat,v){ return (i==0 ? cat : ''); };
		if(!attr.value) attr.value = {};
		if(typeof attr.value.show!=="boolean") attr.value.show = true;
		if(typeof attr.value.align!=="string") attr.value.align = "end";
		if(typeof attr.value.format!=="function") attr.value.format = function(i,t){ return i+''; }
		if(!attr.key) attr.key = {};
		if(!attr.key.align) attr.key.align = "right";

		this.id = (attr.id || 'barchart-'+svgcounter);
		svgcounter++;

		data = attr.data;

		// Add the element
		el.innerHTML = '<div id="'+this.id+'" class="barchart"></div>';

		this.attr = attr;
		
		var cat,txt,tel,dy,bw,n,max,max2,maxpc,h,h2,spacing,total,subtotal,labelwidth,nbars,i,j,k,paper,bars,pc,w,mid,x,y,lcolour,xlabel,tcolour,tanchor,lh;
		
		n = 0;
		max = [];
		spacing = 8;
		h = el.querySelector('.barchart').offsetHeight;
		this.paper = new SVG(this.id);
		this.paper.clear();
		labelwidth = 0;
		nbars = 0;
		bars = {};
		total = [];
		colours = {};
		lh = (attr['line-height']||0);

		if(!attr.colors) attr.colors = [{'color':'#ff6600'},{'color':'#169BD5'}];		
		// See if we've provided over-rides for all category/part colours
		if(!attr.colors.length) colours = attr.colors;

		max2 = 0;
		maxpc = 0;

		// Calculate the category sizes
		for(cat in data){
			if(cat != "Total"){
				
				bars[cat] = new Array(data[cat].length);
				// If this is just a number we turn it into an array
				if(typeof data[cat]==="number"){
					data[cat] = [data[cat]];
				}
				if(typeof colours[cat]==="undefined") colours[cat] = new Array(data[cat].length);
				if(data[cat].length==1 && colours[cat].length > 1) colours[cat] = [colours[cat]];
				for(i = 0; i < data[cat].length; i++){
					if(typeof max[i]==="undefined") max[i] = 0;
					if(typeof total[i]==="undefined") total[i] = 0;
					if(typeof colours[cat][i]==="undefined") colours[cat][i] = (data[cat][i] ? new Array(data[cat][i].length):[]);
					
					// Want to turn this bar into an array
					if(typeof data[cat][i]!=="object") data[cat][i] = [data[cat][i]];
					
					// Calculate the total length of this bar
					bars[cat][i] = {'label':'','values':(data[cat][i] ? new Array(data[cat][i].length):[]),'total':''};
					subtotal = 0;
					if(data[cat][i]){
						for(j = 0; j < data[cat][i].length; j++){
							if(!colours[cat][i][j]) colours[cat][i][j] = (typeof attr.colors[i].color==="string" ? attr.colors[i] : (typeof attr.colors[i].length==="number" ? (attr.colors[i][j] || colours[cat][i][j-1]) :'rgb(100,100,100)'));
							subtotal += (data[cat][i][j]==null ? 0 : data[cat][i][j]);
						}
					}
					max[i] = Math.max(subtotal,max[i]);
					total[i] += subtotal;
					txt = (data[cat][i] ? new Array(data[cat][i].length) : []);
					if(typeof attr.label.format==="function") bars[cat][i].label = attr.label.format(i,cat,(data[cat][i] ? (data[cat][i][j] || '?'):'?'));
					else bars[cat][i].label = cat;

					bars[cat][i].total = subtotal;

					// Work out the category label width
					if(data[cat][i]){
						for(j = 0; j < data[cat][i].length; j++){
							txt[j] = this.paper.text(0,0,bars[cat][i].label).attr({'stroke':'white','fill':'white','stroke-width':0,'text-anchor':'start','dominant-baseline':'middle'});
							this.paper.draw();
							tel = S('#'+txt[j].id)[0];
							if(tel) labelwidth = Math.max(labelwidth,Math.round(tel.getComputedTextLength()));
						}
					}
					this.paper.clear();
					max2 = Math.max(subtotal,max2);
				}
				n++;
			}
		}

		// Set the value labels for each bar
		n = 0;
		for(cat in data){
			if(cat != "Total"){
				nbars = data[cat].length;
				for(i = 0; i < nbars; i++){
					pc = 0;
					if(data[cat][i]){
						for(j = 0; j < data[cat][i].length; j++){
							if(data[cat][i][j]!=null){
								pc = (attr.value.selfscaled) ? (100*data[cat][i][j]/total[i]) : (100*data[cat][i][j]/max2);
								maxpc = Math.max(pc,maxpc);
							}
							bars[cat][i].values[j] = (data[cat][i][j]||0);
						}
					}
				}
				n++;
			}
		}

		// Get the value label width
		var pcwidth = 0;
		if(attr.value.show){
			if(!attr.value.align || attr.value.align=="end"){
				for(cat in bars){
					if(bars[cat]){
						for(i = 0; i < bars[cat].length; i++){
							txt = this.paper.text(0,0,bars[cat][i].values[bars[cat][i].length-1]+'').attr({'stroke':'white','fill':'white','stroke-width':0,'text-anchor':'start','dominant-baseline':'middle'});
							this.paper.draw();
							tel = S('#'+txt.id)[0];
							if(tel) pcwidth = Math.max(pcwidth,Math.round(tel.getComputedTextLength()));
							this.paper.clear();
						}
					}
				}
			}
		}
		if(labelwidth > 0) labelwidth += spacing;
		if(!attr.label.show || attr.label.above) labelwidth = 0;

		
		
		// Set the starting position
		y = 0;
		
		// Draw key
		if(attr.key.show){

			for(k = 0; k < attr.key.values.length; k++) attr.key.values[k].svg = this.paper.text(this.paper.w,(lh+attr['font-size'])/2,attr.key.values[k].title).attr({'stroke':'white','fill':'white','stroke-width':0,'text-anchor':'end','dominant-baseline':'middle','font-size':attr['font-size']*0.6});
			this.paper.draw();
			for(k = 0; k < attr.key.values.length; k++) {
				tel = S('#'+attr.key.values[k].svg.id)[0];
				attr.key.values[k].width = tel.getComputedTextLength();
			}
			this.paper.clear();
			w = lh*0.7;
			h2 = attr['font-size'];
			mid = (attr.title ? lh : h2)/2;
			if(attr.key.align=="right"){
				x = this.paper.w;
				for(k = 0; k < attr.key.values.length; k++) {
					this.paper.text(x,mid,attr.key.values[k].title).attr({'stroke':'white','fill':'white','stroke-width':0,'text-anchor':'end','dominant-baseline':'central','font-size':attr['font-size']*0.6});
					x -= (attr.key.values[k].width+w+5);
					this.paper.rect(x,mid-h2/2,w,h2,0,0).attr({'fill':(attr.key.values[k].color.pattern ? 'url(#'+attr.key.values[k].color.pattern.replace(/.*id="([^\"]*)".*/,function(m,p1){ return p1; })+')' : attr.key.values[k].color.color)});
					x -= 10;
				}
			}else{
				x = 0;
				for(k = attr.key.values.length-1; k >= 0; k--) {
					this.paper.rect(x,mid-h2/2,w,h2,0,0).attr({'fill':(attr.key.values[k].color.pattern ? 'url(#'+attr.key.values[k].color.pattern.replace(/.*id="([^\"]*)".*/,function(m,p1){ return p1; })+')' : attr.key.values[k].color.color)});
					x += (w + 5);
					this.paper.text(x,mid,attr.key.values[k].title).attr({'stroke':'white','fill':'white','stroke-width':0,'text-anchor':'start','dominant-baseline':'central','font-size':attr['font-size']*0.6});
					x += (attr.key.values[k].width+10);
				}
			}
			y += mid*2;
			if(!attr.title) y += spacing;
		}else{
			if(attr.title) y += lh;
		}
		// Draw title
		if(attr.title){
			this.paper.text(0,lh/2,attr.title).attr({'stroke':'white','fill':'white','stroke-width':0,'text-anchor':'start','dominant-baseline':'central','font-size':attr['font-size'],'font-family':attr['font-family']});
		}

		// Work out the height of a category
		dy = (h - y - spacing*(n-1) - (attr.label.above ? attr['font-size']+spacing/2 : 0)*n)/n;

		// Get the maximum bar width
		bw = (this.paper.w - labelwidth - (pcwidth ? (spacing + pcwidth) : 0));
		
		// Define any patterns
		patterns = {};
		for(cat in data){
			for(i = 0; i < colours[cat].length; i++){
				for(j = 0; j < colours[cat][i].length; j++){
					if(colours[cat][i][j].pattern) this.paper.pattern(colours[cat][i][j].pattern);
				}
			}
		}
		var c,v,x,barsectionwidth,xoff;
		xoff = 0;
		x = 0;
		n = 0;
		for(cat in data){
			if(cat != "Total"){
				nbars = data[cat].length;
				x = xoff;
				if(attr.label.show && bars[cat][0].label && attr.label.above){
					lcolour = (attr.label.color ? attr.label.color : colours[cat][0][0].color);
					this.paper.text(x,y+attr['font-size']/2,bars[cat][0].label).attr({'stroke':lcolour,'fill':lcolour,'stroke-width':0,'text-anchor':'start','dominant-baseline':'central'});
					y += attr['font-size']+spacing/2;
				}
				for(i = 0; i < nbars; i++){
					x = xoff;
					lcolour = (attr.label.color ? attr.label.color : colours[cat][i][0].color);
					// Draw bar label
					if(attr.label.show && bars[cat][i].label){
						if(!attr.label.above){
							x = labelwidth;
							this.paper.text(x,y + dy*0.5/nbars,bars[cat][i].label).attr({'stroke':lcolour,'fill':lcolour,'stroke-width':0,'text-anchor':'end','dominant-baseline':'central'});
							xoff = labelwidth + spacing;
							x += spacing;
						}
					}
					if(data[cat][i]){
						for(j = 0; j < data[cat][i].length; j++){
							if(data[cat][i][j]==null) pc = 0;
							else{
								if(attr.value.selfscaled) pc = (data[cat][i][j]/max[i])*100;
								else pc = 100*data[cat][i][j]/max2;
								
								// If we need to keep the percents scaled between bars
								if(attr.value.scalebypercent){
									pc = (data[cat][i][j]/total[i])*100;
									pc = 100*(pc)/maxpc;
								}
							}
							barsectionwidth = parseFloat((bw*pc/100).toFixed(2));
							// Group label
							// Draw bar
							this.paper.rect(x,y,barsectionwidth,dy/nbars,0,0).attr({'fill':(colours[cat][i][j].pattern ? 'url(#'+colours[cat][i][j].pattern.replace(/.*id="([^\"]*)".*/,function(m,p1){ return p1; })+')' : colours[cat][i][j].color)});
							x += barsectionwidth;
							//x += spacing;
							
							// Write bar value
							if(attr.value.show){
								xlabel = x + spacing;
								tcolour = (attr.value.color ? attr.value.color : colours[cat][i][j].color);
								tanchor = 'start';
								if(attr.value.align == "middle"){
									xlabel = x- barsectionwidth*0.5;
									tanchor = 'middle';
								}
								v = '';
								if(attr.value.align=="end"){
									if(j==(data[cat][i].length - 1)){
										v = bars[cat][i].total;
										// Work out how to format the total for the bar pieces
										if(typeof attr.value.format==="function") v = attr.value.format(v,total[i]);
										this.paper.text(xlabel,y + dy*0.5/nbars,v+'').attr({'stroke':tcolour,'fill':tcolour,'stroke-width':0,'text-anchor':tanchor,'dominant-baseline':'central'});
									}
								}else if(attr.value.align=="middle"){
									v = bars[cat][i].values[j];
									// Work out how to format the total for the bar pieces
									if(typeof attr.value.format==="function") v = attr.value.format(v,total[i]);
									this.paper.text(xlabel,y + dy*0.5/nbars,v+'').attr({'stroke':tcolour,'fill':tcolour,'stroke-width':0,'text-anchor':tanchor,'dominant-baseline':'central'});
								}
							}
						}
					}
					y += dy/nbars;
				}
				y += spacing;
				n++;
			}
		}

		this.paper.draw();
		return this;
	}

	root.ODI.barchart = function(el,attr){
		console.log(el,attr)
		if(el) return new SVGBarChart(el,attr);
	}

})(window || this);