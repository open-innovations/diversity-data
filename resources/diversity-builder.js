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

		inps = el.querySelectorAll('input[type=text]');
		
		for(i = 0; i < inps.length; i++){
			if(inps[i].getAttribute('pattern')){
				inps[i].addEventListener('input',function(e){
					e.target.setCustomValidity('');
					e.target.checkValidity();
				});
				inps[i].addEventListener('invalid',function(e){
					e.target.setCustomValidity(e.target.parentNode.querySelector('.pattern').innerHTML);
				});
			}
		}
		sections = document.querySelectorAll('section');
		menu = document.getElementById('menu').querySelectorAll('li a');
		window.addEventListener('scroll',function(e){
			var ok = -1;
			for(var s = 0; s < sections.length; s++){
				if(sections[s].offsetTop <= window.scrollY+5) ok = s;
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
		return this;
	}

	ODI.ready(function(){
		root.builder = new Builder(document.getElementById('builder'));
	});

	root.ODI = ODI;
	
})(window || this);
