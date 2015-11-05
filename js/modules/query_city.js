/**
 * Created by huangzy on 15-11-5.
 */
var LocationCity = require("./location_city.js");
var localCity = null;
var QueryCity = RichBase.extend({
	statics : {
		WARN_LOCAL_CITY_KEY : "warn_local_city",
		ALL_CITYS_STORAGE_KEY : "PFT-WX-16U-ALLCITY",
		getStorage : function(){
			var citys = window.localStorage.getItem(this.ALL_CITYS_STORAGE_KEY);
			return citys ? JSON.parse(citys) : null;
		},
		setStorage : function(citys){
			if(!citys) return false;
			window.localStorage.setItem(this.ALL_CITYS_STORAGE_KEY,JSON.stringify(citys));
		}
	},
	EVENTS : {
		"input" : {
			"#searchInp" : "onSearchInpChange"
		},
		"tap" : {
			"#search_clearBtn" : "onClearBtnTap",
			".cityUl .cityItem" : "onCityItemTap",
			".allCityBtn" : "onAllCityBtnTap",
			"#locateCurrentCity" : "onLocateCurrentCityTap"
		}
	},
	init : function(opt){
		this.container = opt.container;
		this.clearBtn = $("#search_clearBtn");
		this.listUl = $("#allcityUl");
		this.searchInp = $("#searchInp");
		this.initLocateCity();
		this.getCityData();
	},
	getCityData : function(){
		var that = this;
		var listUl = this.listUl;
		var all_citys = this.statics.getStorage();
		if(all_citys){
			this.render(all_citys);
			this.fire("ready");
		}else{
			PFT.Ajax({
				url : PFT.Url.order_v3,
				type : "get",
				dataType : "json",
				data : {
					action : "area_list"
				},
				loading : function(){
					listUl.html('<li class="sta state loading"><i class="iconfont loading">&#xe644;</i><span class="t">加载城市...</span></li>');
					that.fire("fetch.citys.loading");
				},
				removeLoading : function(res){
					listUl.html("");
					that.fire("fetch.citys.complete");
					that.fire("ready");
				},
				timeout : function(res){
					listUl.html('<li class="sta state timeout"><i class="iconfont">&#xe669;</i><span class="t">请求超时,请稍后重试...</span></li>');
					that.fire("fetch.citys.timeout");
				},
				serverError : function(res){
					listUl.html('<li class="sta state serverError"><i class="iconfont">&#xe669;</i><span class="t">请求出错,请稍后重试...</span></li>');
					that.fire("fetch.citys.serverError");
				}
			},function(res){
				var code = res.code;
				var areas = res.areas;
				if(code==200){
					that.statics.setStorage(areas);
					that.render(res.areas);
				}else{
					listUl.html('<li class="sta state fail"><i class="iconfont">&#xe669;</i><span class="t">请求失败,请稍后重试...</span></li>');
					that.fire("fetch.citys.fail");
				}
			})
		}
	},
	//定位城市
	initLocateCity : function(){
		var that = this;
		var locateCurrentCity = $("#locateCurrentCity").find(".city");
		localCity = new LocationCity();
		localCity.local({
			loading : function(){ locateCurrentCity.text("定位中..");},
			complete : function(res){ locateCurrentCity.text("定位完成");},
			success : function(cityname){
				console.log("定位到城市："+cityname);
				if(!cityname) return false;
				var curCity = LocationCity.getCity();
				locateCurrentCity.text(cityname).attr("data-city",cityname);
				if((cityname!==curCity) && !LocationCity.unLikeCitys()[cityname]){
					var result = confirm("系统定位到您当前所在城市为："+cityname+"，是否切换？");
					if(result){
						//把定位到的城市替换localstorage里的定位城市
						LocationCity.setCityToStorage(cityname);
						that.fire("city.location.switch",cityname);
					}else{
						//把不想切换的城市加入到不切换城市列表
						LocationCity.unLikeCitys(cityname);
					}
				}
			},
			fail : function(res){ console.log("城市定位失败")}
		})
	},
	open : function(){
		this.container.addClass("current");
		this.fire("open");
	},
	close : function(){
		this.container.removeClass("current");
		this.fire("close");
	},
	setLocateCurrentCity : function(cityname,cityid){
		$("#locateCurrentCity").show().find(".city").text(cityname).attr("data-cityid",cityid);
	},
	onSearchInpChange : function(that,e){
		var tarInp = $(e.currentTarget);
		var val = tarInp.val();
		if(val){
			that.clearBtn.show();
			$("#locateCurrentCity").hide();
		}else{
			that.clearBtn.hide();
			$("#locateCurrentCity").show();
		}
		that.render(that.filter(val));
	},
	onClearBtnTap : function(that,e){
		$(e.currentTarget).hide();
		that.searchInp.val("").focus();
		$("#locateCurrentCity").show();
		that.render(that.statics.getStorage());
	},
	onCityItemTap : function(that,e){
		var tarItem = $(e.currentTarget);
		if(tarItem.hasClass("selected")) return false;
		that.container.find(".cityItem").removeClass("selected");
		tarItem.addClass("selected");
		that.fire("city.tap",{
			name : tarItem.attr("data-name"),
			id : tarItem.attr("data-id"),
			pin : tarItem.attr("data-pin"),
			abb : tarItem.attr("data-abb")
		})
		that.close();
	},
	onLocateCurrentCityTap : function(that,e){
		var curCity = $(e.currentTarget).find(".city");
		var getCityCodeByCityName = function(cityname){
			var all_citys = that.statics.getStorage();
			var result_code = "";
			for(var leter in all_citys){
				var citys = all_citys[leter];
				for(var i in citys){
					var city = citys[i];
					var cname = city["hanzi"];
					var code = city["id"];
					if(cname==cityname){
						result_code = code;
						break;
					}
				}
			}
			return result_code;
		};
		var cityname = curCity.attr("data-city");
		if(cityname){
			that.fire("city.tap",{
				name : cityname,
				id : getCityCodeByCityName(cityname),
				pin : "",
				abb : "",
				type : "currentLocation"
			});
		}
	},
	//搜索过滤
	filter : function(val){
		var all = this.statics.getStorage();
		if(!val) return all;
		val = val.toLowerCase();
		var result = {};
		var arr = [];
		var first_letter = val.substring(0,1);
		if(PFT.Help.isEng(first_letter)){ //首字符是英文
			var citys = all[first_letter];
			if(citys){
				for(var i in citys){
					var city = citys[i];
					var pin = city["pinyin"];
					var abb = city["shouzimu"];
					var hanzi = city["hanzi"];
					if(pin.indexOf(val)>-1 || abb.indexOf(val)>-1 || hanzi.indexOf(val)>-1){
						arr.push({
							a: city["a"],
							hanzi : hanzi,
							id : city["id"],
							pinyin : pin,
							shouzimu : abb
						})
					}
				}
				result["0"] = arr;
			}
		}else if(PFT.Help.isChina(first_letter)){ //首字符是中文
			for(var i in all){
				var group = all[i];
				for(var g in group){
					var city = group[g];
					var hanzi = city["hanzi"];
					if(hanzi.indexOf(val)>-1){
						arr.push({
							a: city["a"],
							hanzi : city["hanzi"],
							id : city["id"],
							pinyin : city["pinyin"],
							shouzimu : city["shouzimu"]
						})
					}
				}
			}
			result["0"] = arr;
		}
		return result;
	},
	render : function(data){
		var html = "";
		for(var i in data){
			var group = data[i];
			var letter = i.toUpperCase();
			var letterCls = letter=="0" ? "none" : "let";
			html += '<li class="group">';
			html += 	'<p class="letter '+letterCls+'">'+letter+'</p>';
			html +=		'<ul class="cityUl">';
			for(var g in group){
				var city = group[g];
				var id = city["id"];
				var name = city["hanzi"];
				var pinyin = city["pinyin"];
				var shouzimu = city["shouzimu"];
				html += [
					'<li class="cityItem" data-name="'+name+'" data-id="'+id+'" data-pin="'+pinyin+'" data-abb="'+shouzimu+'">',
					'<span class="t">'+name+'</span><i class="iconfont select">&#xe63f;</i>',
					'</li>'
				].join("");
			}
			html +=	'</ul>';
			html += '</li>';
		}
		if(!html){
			html += '<li class="state empty">没有匹配城市...</li>';
		}
		this.listUl.html(html);
	}
});
module.exports = QueryCity;