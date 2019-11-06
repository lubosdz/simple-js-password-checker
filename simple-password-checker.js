/*
Simple javascript password strength meter with strip animation
--------------------------------------------------------------
* https://github.com/lubosdz/simple-js-password-checker
* Pure JS implementation without dependency based on answers:
* https://stackoverflow.com/questions/948172/password-strength-meter
* Distributed without licence, use at your own risk & will :-)

NOTES
-----
* Entrophy score is calculated for each unique letter (+5 points) but only +1 point for repeated chars
* Extra score bonus is awarded for combining with digits, lower & upper letters and non-word characters
* The "id_entrophy" element can be set optionally, if score needs to be submitted to server
* For animation set ID of DIV e.g. "id_strip" and adjust CSS - see bellow
* No jQuery dependency and no support for very old browsers (required native JS function "document.getElementById")

Example:
========

Markup (based on bootstrap 4):
------------------------------
<div class="p-3 m-3">
	Your password
	<input type="text" id="id_password" class="form-control">
	<div id="id_strip" class="py-2 mt-1"></div>
	<input type="hidden" id="id_entrophy">
</div>

Options:
--------
window.simple_password_checker.init({
	id_password : "id_password",
	id_entrophy : "id_entrophy",
	id_strip : "id_strip",
	text_weak : "<i class='fa fa-frown-o'></i> Weak password",
	text_good : "<i class='fa fa-meh-o'></i> Good password",
	text_strong : "<i class='fa fa-smile-o'></i> Strong password",
	css_weak : "badge badge-danger",
	css_good : "badge badge-warning",
	css_strong : "badge badge-success",
	score_good : 50,
	min_length : 8
});

*/

window.simple_password_checker = {

	// text input password element
	id_password : '',
	// hidden input will contain calculated entrophy - can be submitted to server
	id_entrophy : '',
	// e.g. DIV animated colored strip red - yellow - green, according to calculated score
	id_strip : '',

	// HTML to display if strip has zero length
	html_empty_strip : '',
	// apply fancy CSS animation on strip meter
	css_transition : '0.5s',

	text_weak : 'Weak',
	text_good : 'Good',
	text_strong : 'Strong',

	css_weak : 'badge badge-danger',
	css_good : 'badge badge-warning',
	css_strong : 'badge badge-success',

	// limits
	score_strong : 60,
	score_good : 40,
	min_length : 6,

	// input elements, runtime vars
	el_password : null,
	el_entrophy : null,
	el_strip : null,

	// turn on/off alerts
	debug : false,

	init : function(options) {

		// About merging props: https://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
		// but we rather simply control each property ..
		if(options.id_password != undefined){
			this.id_password = options.id_password;
		}
		if(options.id_entrophy != undefined){
			this.id_entrophy = options.id_entrophy;
		}
		if(options.id_strip != undefined){
			this.id_strip = options.id_strip;
		}
		if(options.html_empty_strip != undefined){
			this.html_empty_strip = options.html_empty_strip;
		}
		if(options.css_transition != undefined){
			this.css_transition = options.css_transition;
		}
		if(options.text_weak != undefined){
			this.text_weak = options.text_weak;
		}
		if(options.text_good != undefined){
			this.text_good = options.text_good;
		}
		if(options.text_strong != undefined){
			this.text_strong = options.text_strong;
		}
		if(options.css_weak != undefined){
			this.css_weak = options.css_weak;
		}
		if(options.css_good != undefined){
			this.css_good = options.css_good;
		}
		if(options.css_strong != undefined){
			this.css_strong = options.css_strong;
		}
		if(options.score_strong != undefined){
			this.score_strong = parseInt(options.score_strong);
		}
		if(options.score_good != undefined){
			this.score_good = parseInt(options.score_good);
		}
		if(options.min_length != undefined){
			this.min_length = parseInt(options.min_length);
		}
		if(options.debug != undefined){
			this.debug = options.debug;
		}

		var self = this;

		if(!document.getElementById){
			self.debug && alert("Your browser is too old - password checker does not support too old browsers.");
			return;
		}

		// required input
		if(!self.id_password){
			self.debug && alert("Please specify input field for password.");
			return;
		}

		self.el_password = document.getElementById(self.id_password);
		if(!self.el_password){
			self.debug && alert("Input field for password ["+self.id_password+"] not found.");
			return;
		}

		// optional inputs
		if(self.id_entrophy){
			self.el_entrophy = document.getElementById(self.id_entrophy);
			if(!self.el_entrophy){
				self.debug && alert("Field for entrophy ["+self.el_entrophy+"] not found.");
			}
		}

		if(self.id_strip){
			self.el_strip = document.getElementById(self.id_strip);
			if(!self.el_strip){
				self.debug && alert("Field for entrophy ["+self.id_strip+"] not found.");
			}
		}

		// attach listener
		self.el_password.onkeyup = function(){
			self.checkPassStrength(self.el_password.value);
		}

		// if there is already value, sync score
		if(self.el_password.value){
			self.checkPassStrength(self.el_password.value);
		}

	},

	checkPassStrength : function (pwd) {

		var self = this, perc,
			pwd = (pwd == undefined) ? '' : pwd.toString().replace(/^\s+|\s+$/g, ""), // trim surrounding whitespaces
			score = self.calculatePwdScore(pwd),
			hasMinChars = !this.min_length || pwd.length >= this.min_length;

		// % strip width
		perc = score;
		if(perc < 0) {
			perc = 0;
		} else if (perc > 100) {
			perc = 100;
		}

		if(self.el_entrophy){
			// it's easier to work with percentage than with entrophy score
			self.el_entrophy.value = perc;
		}

		if(self.el_strip){
			self.el_strip.style.width = perc+"%";
			if(self.css_transition){
				self.el_strip.style.transition = self.css_transition;
			}

			self.removeClass(self.el_strip, self.css_weak);
			self.removeClass(self.el_strip, self.css_good);
			self.removeClass(self.el_strip, self.css_strong);

			if (hasMinChars && perc >= self.score_strong) {
				self.addClass(self.el_strip, self.css_strong);
				self.el_strip.innerHTML = self.text_strong;
			} else if (hasMinChars && score >= self.score_good) {
				self.addClass(self.el_strip, self.css_good);
				self.el_strip.innerHTML = self.text_good;
			} else if(pwd) {
				self.addClass(self.el_strip, self.css_weak);
				self.el_strip.innerHTML = self.text_weak;
			} else {
				self.el_strip.innerHTML = self.html_empty_strip;
				self.el_strip.style.width = '';
			}
		}
	},

	calculatePwdScore : function (pwd) {
		var score = 0;
		if (!pwd) {
			return score;
		}
		// award every unique letter until 5 repetitions
		var letters = new Object();
		for (var i=0; i<pwd.length; i++) {
			letters[pwd[i]] = (letters[pwd[i]] || 0) + 1;
			score += 5.0 / letters[pwd[i]];
		}

		// bonus points for mixing it up
		var variations = {
			digits: /\d/.test(pwd),
			lower: /[a-z]/.test(pwd),
			upper: /[A-Z]/.test(pwd),
			nonWords: /\W/.test(pwd),
		}

		variationCount = 0;
		for (var check in variations) {
			variationCount += (variations[check] == true) ? 1 : 0;
		}
		score += (variationCount - 1) * 10;

		return parseInt(score, 10);
	},

	hasClass : function (ele, cls) {
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	},

	addClass : function (ele, cls) {
		var space = ele.className.length > 1 ? ' ' : '';
		if (!this.hasClass(ele, cls)) {
			ele.className += space + cls;
		}
	},

	removeClass : function (ele, cls) {
		if (this.hasClass(ele, cls)) {
			var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
			ele.className = ele.className.replace(reg, ' ');
		}
	}

}
