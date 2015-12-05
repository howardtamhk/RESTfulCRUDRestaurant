var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//var mongodbURL = 'mongodb://localhost:27017/test';
var mongodbURL = 'mongodb://MongoDB-q:tZgAX0zx_rzgFcmWO86Mqse.woITmc1e.5eozkCgz7I-@ds054118.mongolab.com:54118/MongoDB-q'
var mongoose = require('mongoose');

function isAddress(field){
	if(field == "street" || field == "building" || field == "zipcode")
		return true;
	return false;
	//console.log(field);return;
}

function handleFindObj(req,res,field,value,field2,value2){
	var findObj = {};
	if(field == 'lon' && field2 == 'lat'){
		if(isNaN(Number(value)) || isNaN(Number(value2))){
			res.status(500).json({message: "lat or lon not a number"});
			return;
		}
		findObj["address.coord"] = [Number(value),Number(value2)];
		return findObj;
	}

	if(isAddress(field)){
		findObj["address."+field] = value;
	}else{
		findObj[field] = value;
	}

	if(field2){
		if(isAddress(field2)){
		findObj["address."+field2] = value2;
		}else{
			findObj[field2] = value2;
		}
	}
	return findObj;
}

function handlePutObj(req,res){
	var rObj = {};

	if(req.body.building)
		rObj["address.building"] = req.body.building;
	if(req.body.street)
		rObj["address.street"] = req.body.street;
	if(req.body.zipcode)
		rObj["address.zipcode"] = req.body.zipcode;
	if(req.body.lon&&req.body.lat){
		rObj["address.coord"] = [];
		if(isNaN(Number(req.params.lon)) || isNaN(Number(req.params.lat))){
			res.status(500).json({message: "lat or lon not a number"});
			return;
		}
		rObj["address.coord"] .push(Number(req.body.lon));
		rObj["address.coord"] .push(Number(req.body.lat));
	}
	if(req.body.borough)
		rObj.borough = req.body.borough;
	if(req.body.cuisine)
		rObj.cuisine = req.body.cuisine;
	if(req.body.name)
		rObj.name = req.body.name;

	return rObj;
}

function getByObj(findObj,req,res){
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find(findObj,function(err,results){
	       		if (err) {
				res.status(500).json(err);
				throw err
			}
			if (results.length > 0) {
				res.status(200).json(results);
			}
			else {
				res.status(200).json({message: 'No matching document', restaurant_id: req.params.id});
			}
			db.close();
		});
	});
}

function putByObj(findObj,putObj,req,res){
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.update(findObj,putObj,function(err){
			if(err){
				res.status(500).json(err);
				throw err;
			}else{
				db.close();
				res.status(200).json({message: 'update done', restaurant_id: req.params.id});
			}
		});
    	});
}

function delByObj(findObj,req,res){
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find(findObj).remove(function(err) {
       		if (err) {
				res.status(500).json(err);
				throw err
			}
       		//console.log('Restaurant removed!')
       		db.close();
			res.status(200).json({message: 'delete done', restaurant_id: req.params.id});
    	});
    });
}

app.post('/',function(req,res) {
	//console.log(req.body);
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var rObj = {};
		rObj.address = {};
		rObj.address.building = req.body.building;
		rObj.address.street = req.body.street;
		rObj.address.zipcode = req.body.zipcode;
		rObj.address.coord = [];
		rObj.address.coord.push(req.body.lon);
		rObj.address.coord.push(req.body.lat);
		rObj.borough = req.body.borough;
		rObj.cuisine = req.body.cuisine;
		rObj.name = req.body.name;
		rObj.restaurant_id = req.body.restaurant_id;

		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		var r = new Restaurant(rObj);
		//console.log(r);return;
		r.save(function(err) {
       		if (err) {
			res.status(500).json(err);
			throw err
		}
       		//console.log('Restaurant created!')
       		db.close();
		res.status(200).json({message: 'insert done', _id: r._id});
    	});
    });
});

app.delete('/restaurant_id/:id',function(req,res) {
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find({restaurant_id: req.params.id}).remove(function(err) {
       		if (err) {
			res.status(500).json(err);
			throw err
		}
       		//console.log('Restaurant removed!')
       		db.close();
		res.status(200).json({message: 'delete done', restaurant_id: req.params.id});
    	});
    });
});

app.delete('/:field/:value', function(req,res) {
	var findObj = {};
	findObj = handleFindObj(req,res,req.params.field,req.params.value,"","");	
	delByObj(findObj,req,res)	
});

app.delete('/:field/:value/:field2/:value2', function(req,res) {	
	var findObj = {};
	findObj = handleFindObj(req,res,req.params.field,req.params.value,req.params.field2,req.params.value2);
	
	//console.log(findObj);return;
	delByObj(findObj,req,res)	
});

app.delete('/or/:field/:value/:field2/:value2', function(req,res) {	
	var valueObj = [];
	var value1 = {};
	value1 = handleFindObj(req,res,req.params.field,req.params.value,"","");
	var value2 = {};
	value2 = handleFindObj(req,res,req.params.field2,req.params.value2,"","");
	
	valueObj.push(value1);
	valueObj.push(value2);	
	var findObj = {$or: valueObj}
	
	//console.log(findObj);return;
	delByObj(findObj,req,res)	
});

app.get('/restaurant_id/:id', function(req,res) {
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find({restaurant_id: req.params.id},function(err,results){
       		if (err) {
			res.status(500).json(err);
			throw err
		}
		if (results.length > 0) {
			res.status(200).json(results);
		}
		else {
			res.status(200).json({message: 'No matching document', restaurant_id: req.params.id});
		}
		db.close();
    	});
    });
});

app.get('/:field/:value', function(req,res) {
	//console.log(req.params.field,req.params.value);return;
	var findObj = {};
	findObj = handleFindObj(req,res,req.params.field,req.params.value,"","");
	//console.log(findObj);return;
	getByObj(findObj,req,res);
});

/*app.get('/address/:field/:value', function(req,res) {
	//console.log(req.params.field,req.params.value);return;
	var findObj = {};
	findObj["address."+req.params.field] = req.params.value;
	//console.log(findObj);return;
	getByObj(findObj,req,res);
});

app.get('/address/coord/lon/:lon/lat/:lat', function(req,res) {
	//console.log(req.params.field,req.params.value);return;
	var findObj = {};
	if(isNaN(Number(req.params.lon)) || isNaN(Number(req.params.lat))){
		res.status(500).json({message: "lat or lon not a number"});
		return;
	}
	findObj["address.coord"] = [Number(req.params.lon),Number(req.params.lat)];
	//console.log(findObj);return;
	getByObj(findObj,req,res);
});*/

app.get('/:field/:value/:field2/:value2', function(req,res) {
	//console.log(req.params.field,req.params.value);return;
	var findObj = {};
	findObj = handleFindObj(req,res,req.params.field,req.params.value,req.params.field2,req.params.value2);
	//console.log(findObj);return;
	getByObj(findObj,req,res);
});

app.get('/or/:field/:value/:field2/:value2', function(req,res) {
	//console.log(req.params.field,req.params.value);return;
	var valueObj = [];
	var value1 = {};
	value1 = handleFindObj(req,res,req.params.field,req.params.value,"","");
	var value2 = {};
	value2 = handleFindObj(req,res,req.params.field2,req.params.value2,"","");
	valueObj.push(value1);
	valueObj.push(value2);
	//console.log(valueObj);return;
	var findObj = {$or: valueObj}
	console.log(findObj);return;
	getByObj(findObj,req,res);
});



app.put('/:field/:value',function(req,res) {
	//console.log(req.body);
	var rObj = {};
	rObj = handlePutObj(req,res);
	
	
	//console.log(rObj);return;
	if(Object.keys(rObj).length>0){
		var findObj = {};
		findObj = handleFindObj(req,res,req.params.field,req.params.value,"","");
		//console.log(findObj,rObj);return;
		putByObj(findObj,rObj,req,res);
	}else{
		res.status(500).json({message: "Empty Data"});
		return;
	}
	
	
});

app.put('/:field/:value/:field2/:value2',function(req,res) {
	//console.log(req.body);
	var rObj = {};
	rObj = handlePutObj(req,res);
	
	
	//console.log(rObj);return;
	if(Object.keys(rObj).length>0){
		var findObj = {};
		findObj = handleFindObj(req,res,req.params.field,req.params.value,req.params.field2,req.params.value2);
		console.log(findObj,rObj);return;
		putByObj(findObj,rObj,req,res);
	}else{
		res.status(500).json({message: "Empty Data"});
		return;
	}
	
	
});

app.put('/or/:field/:value/:field2/:value2',function(req,res) {
	//console.log(req.body);
	var rObj = {};
	rObj = handlePutObj(req,res);
	
	
	//console.log(rObj);return;
	if(Object.keys(rObj).length>0){
		var findObj = {};
		var find1 = {};
		find1 = handleFindObj(req,res,req.params.field,req.params.value,"","");
		var find2 = {};
		find2s = handleFindObj(req,res,req.params.field2,req.params.value2,"","");
		findObj.push(find1);
		findObj.push(find1);

		//console.log(findObj,rObj);return;
		putByObj(findObj,rObj,req,res);
	}else{
		res.status(500).json({message: "Empty Data"});
		return;
	}
	
	
});

app.put('/:field/:value/address',function(req,res) {
	var rObj = {};
	if(req.body.building||req.body.street||req.body.zipcode||req.body.lon||req.body.lat)
		rObj.address = {};
	if(req.body.building)
		rObj.address.building = req.body.building;
	else
		rObj.address.building = "";
	if(req.body.street)
		rObj.address.street = req.body.street;
	else
		rObj.address.street = "";
	if(req.body.zipcode)
		rObj.address.zipcode = req.body.zipcode;
	else
		rObj.address.zipcode = "";
	rObj.address.coord = [];
	if(req.body.lon&&req.body.lat){
		if(isNaN(Number(req.body.lon)) || isNaN(Number(req.body.lat))){
			res.status(500).json({message: "lat or lon not a number"});
			return;
		}
		rObj.address.coord.push(Number(req.body.lon));
		rObj.address.coord.push(Number(req.body.lat));
	}
	
	//console.log(rObj);return;
	if(Object.keys(rObj).length>0){
		var findObj = {};
		findObj[req.params.field] = req.params.value;
		putByObj(findObj,rObj,req,res);
	}else{
		res.status(500).json({message: "Empty Data"});
		return;
	}
	
	
});

app.put('/restaurant_id/:id/grade', function(req,res){
	var gradeObj = {};
	gradeObj.date = req.body.date;
	gradeObj.grade = req.body.grade;
	gradeObj.score = req.body.score;
	//console.log(gradeObj);return;
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.update({restaurant_id:req.params.id},{$push:{"grades":gradeObj}},function(err){
			if(err){
				res.status(500).json(err);
				throw err;
			}else{
				db.close();
				res.status(200).json({message: 'update done'});
			}
		});
	});
});

app.listen(process.env.PORT || 8099);
