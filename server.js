var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var mongodbURL = 'mongodb://localhost:27017/test';
var mongoose = require('mongoose');

app.post('/',function(req,res) {
	//console.log(req.body);
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect('mongodb://localhost/test');
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
	mongoose.connect('mongodb://localhost/test');
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

app.get('/restaurant_id/:id', function(req,res) {
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect('mongodb://localhost/test');
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

app.put('/restaurant_id/:id/grade', function(req,res){
	var gradeObj = {};
	gradeObj.date = req.body.date;
	gradeObj.grade = req.body.grade;
	gradeObj.score = req.body.score;
	//console.log(gradeObj);return;
	var restaurantSchema = require('./models/restaurant');
	mongoose.connect('mongodb://localhost/test');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		/*Restaurant.findOne({restaurant_id: req.params.id},function(err,result){
			if(err){
				res.status(500).json(err);
				throw err;
			}
			
			result.grades.push(gradeObj);
			//console.log(result);
			result.save(function(err) {
				if(err){
					res.status(500).json(err);
					throw err;
				}
				res.status(200).json({message: 'update done'});
				db.close();
			});
			
		});*/
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
