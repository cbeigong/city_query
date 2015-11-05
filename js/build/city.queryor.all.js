/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by Administrator on 15-11-2.
	 */
	var QueryCity = __webpack_require__(2);
	PFT["QueryCity"] = PFT["QueryCity"] || QueryCity;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by huangzy on 15-11-5.
	 */
	var LocationCity = __webpack_require__(3);
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

/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 * Created by huangzy on 15-11-5.
	 */
	var LocationCity = RichBase.extend({
		statics : {
			DEFAULT_CITY : "福州", //默认城市
			LOCALSTORAGE_KEY : "wx-16u-local-city",
			UNLIKE_CITY_STORAGE_KEY : "wx-16u-unlink-city",
			getCityFromStorage : function(){
				return localStorage.getItem(this.LOCALSTORAGE_KEY);
			},
			setCityToStorage : function(cityname){
				if(!cityname) return false;
				localStorage.setItem(this.LOCALSTORAGE_KEY,cityname);
			},
			removeCityFromStorage : function(){
				localStorage.removeItem(this.LOCALSTORAGE_KEY);
			},
			unLikeCitys : function(city){ //set or get
				var storage = localStorage.getItem(this.UNLIKE_CITY_STORAGE_KEY);
				if(!city){
					if(!storage) return {};
					return JSON.parse(storage);
				}else{
					if(!storage) storage = "{}";
					storage = storage.parse();
					storage[city] = 1;
					localStorage.setItem(this.UNLIKE_CITY_STORAGE_KEY,JSON.stringify(storage));
				}
			},
			getCity : function(){
				var city = this.getCityFromStorage();
				if(!city) city = this.DEFAULT_CITY;
				return city;
			}
		},
		init : function(){},
		/**
		 * 定位城市  可选择h5定位或IP地址定位(type参数)
		 * @param opt
		 * local({
		 * 		loading : function(){},
		 * 		complete : function(res){},
		 * 		success : function(cityname){},
		 * 		fail : function(res){}
		 * })
		 * local.on("loading",function(){})
		 * local.on("complete",function(res){})
		 * local.on("success",function(cityname){})
		 * local.on("fail",function(res){})
		 */
		local : function(opt){
			var that = this;
			var fn = new Function;
			var type = opt.type || "H5";
			var loading = opt.loading || fn;
			var complete = opt.complete || fn;
			var success = opt.success || fn;
			var fail = opt.fail || fn;
			loading();
			that.fire("loading");
			if(type=="H5"){
				var geolocation = new BMap.Geolocation();
				geolocation.getCurrentPosition(function(res){
					//关于状态码
					//BMAP_STATUS_SUCCESS	检索成功。对应数值“0”。
					//BMAP_STATUS_CITY_LIST	城市列表。对应数值“1”。
					//BMAP_STATUS_UNKNOWN_LOCATION	位置结果未知。对应数值“2”。
					//BMAP_STATUS_UNKNOWN_ROUTE	导航结果未知。对应数值“3”。
					//BMAP_STATUS_INVALID_KEY	非法密钥。对应数值“4”。
					//BMAP_STATUS_INVALID_REQUEST	非法请求。对应数值“5”。
					//BMAP_STATUS_PERMISSION_DENIED	没有权限。对应数值“6”。(自 1.1 新增)
					//BMAP_STATUS_SERVICE_UNAVAILABLE	服务不可用。对应数值“7”。(自 1.1 新增)
					//BMAP_STATUS_TIMEOUT	超时。对应数值“8”。(自 1.1 新增)
					var status = this.getStatus();
					if(status==0){
						var point = res.point;
						var lng = point.lng;
						var lat = point.lat;
						$.getJSON('http://api.map.baidu.com/geocoder/v2/?ak=485641E293ABd3523de065f7c1bbfeba&callback=?&location='+lat+','+lng+'&output=json&pois=1', function(res){
							complete(res);
							that.fire("complete",res);
							if(res && res.result && res.result.addressComponent && res.result.addressComponent.city){
								var city = res.result.addressComponent.city;
								if(city.indexOf("市")) city = city.substring(0,city.length-1);
								success(city);
								that.fire("success",city);
							}else{
								fail(res);
								that.fire("fail",res);
							}
						});
					}else{
						complete(res);
						that.fire("complete",res);
						fail(res);
						that.fire("fail",res);
					}
				},{enableHighAccuracy:true});
			}else{
				var myCity = new BMap.LocalCity();
				myCity.get(function(result){
					complete(result);
					that.fire("complete",result);
					if(result && result.name){
						success(result.name);
						that.fire("success",result.name);
					}else{
						fail(result);
						that.fire("fail",result);
					}
				});
			}
		}
	});
	module.exports = LocationCity;



/***/ }
/******/ ]);