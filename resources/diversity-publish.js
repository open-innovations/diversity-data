(function(root){

	var OI = root.OI || {};
	if(!OI.ready){
		OI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

	function Page(el){

		this.sections = document.querySelectorAll('section');
		this.menu = document.getElementById('menu').querySelectorAll('li a');
		// Highlight the current section in the menu
		addEvent('scroll',[window],{this:this},function(e){ this.scroll(); });

		var y = parseInt(window.getComputedStyle(document.querySelector('header')).height);
		for(var i = 0; i < this.sections.length; i++) this.sections[i].style['scroll-margin-top'] = y+'px';

		return this;
	}
	Page.prototype.scroll = function(){
		var ok,i,s;
		ok = -1;
		for(s = 0; s < this.sections.length; s++){
			if(this.sections[s].offsetTop <= window.scrollY + parseInt(window.getComputedStyle(this.sections[s])['scroll-margin-top']) + 5) ok = s;
		}
		// Remove any previous selection
		for(i = 0; i < this.menu.length; i++) this.menu[i].classList.remove('selected');
		// Select this menu item
		if(ok >= 0) this.menu[ok].classList.add('selected');
		
		return this;
	};
	Page.prototype.updateOffset = function(){
		var y = (this.buttons.el.offsetHeight + parseInt(window.getComputedStyle(this.buttons.el).top));
		for(var i = 0; i < this.sections.length; i++) this.sections[i].style['scroll-margin-top'] = y+'px';
		return this;
	};
	
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
		root.publish = new Page(document.getElementById('page'));
	});

	root.OI = OI;
	
})(window || this);
