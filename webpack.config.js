/**
 * Created by Administrator on 15-9-21.
 */
var path = require("path");
module.exports = {
	entry : [
		"./js/main.js"
	],
	output : {
		path : path.join(__dirname,"./js/build"),
		filename: "city.queryor.all.js"
	},
	watch : true
}