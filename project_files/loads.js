const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const ds = require('./datastore');

const datastore = ds.datastore;

const BOAT = "Boat";
const LOAD = "Load";

const checkJWT = require('./checkJWT');

// const CLIENT_ID = 'LJU1XOfhaIpSEYEG4Q1ecz1XhnBazBe1';
// const CLIENT_SECRET = 'Pnf8V9HEXOUXoQputS79P97EIIodE0zQBULFICG88Ub_BjShjofr2eeEWRFe7UOW';
// const DOMAIN = 'sabinand-cs493-module7.us.auth0.com';

router.use(bodyParser.json());



/* ------------- Begin load Model Functions ------------- */
async function post_load(volume, item, creation_date, public, owner){
    var key = datastore.key(LOAD);
	let new_load = {"volume": volume, "item": item, "creation_date":creation_date, "public": public, "owner":owner};
    return datastore.save({"key":key, "data":new_load}).then(() => {return key});
}

async function get_load(id) {
    const key = datastore.key([LOAD, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {

        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(ds.fromDatastore);
        }
    });
}

function get_loads(req, owner){
    var q = datastore.createQuery(LOAD).limit(4);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.loads = entities[0].map(ds.fromDatastore).filter(item => item.owner === owner );
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}

function get_loads_unprotected(req){
    var q = datastore.createQuery(LOAD).limit(4);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.loads = entities[0].map(ds.fromDatastore).filter(item => item.public === true);
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}

async function patch_load(id, volume, item, creation_date, public){
    const key = datastore.key([LOAD, parseInt(id,10)]);
    const [entity] = await datastore.get(key);
    let load;
    let load_volume;
    let load_item;
    let load_creation_date;
    let load_public;
    if (entity == undefined){
        return;
    }
    if (volume == null || volume == undefined){
        load_volume = entity.volume;
    }
    else{
        load_volume = volume;
    }
    if (item == null || item == undefined){
        load_item = entity.item;
    }
    else {
        load_item = item;
    }
    if (creation_date == null || creation_date == undefined){
        load_creation_date = entity.creation_date;
    }
    else {
        load_creation_date = creation_date;
    }
    if (public == null || public == undefined){
        load_public = entity.public;
    }
    else {
        load_public = public;
    }
    load = {"volume": load_volume, "item": load_item, "creation_date": load_creation_date, 
    "carrier": entity.carrier, "public":load_public}
    return datastore.save({"key": key, "data":load});
}

// function put_load(id, item){
//     const key = datastore.key([LOAD, parseInt(id,10)]);
//     const load = {"item": item};
//     return datastore.save({"key":key, "data":load});
// }

async function put_load(id, volume, item, creation_date, public){
    if (volume === null || volume === undefined || item === null || item === undefined || creation_date === null ||
        creation_date === undefined || public === undefined || public === null){
            return;
    }
    else{
        const key = datastore.key([LOAD, parseInt(id,10)]);
        const [load_ent] = await datastore.get(key);
        const load_carrier = load_ent.carrier;
        const load_owner = load_ent.owner;
        if (load_carrier === null || load_carrier === undefined){
            const boat = {"volume": volume, "item": item, "creation_date": creation_date, "public": public, "owner":load_owner};
            return datastore.save({"key":key, "data":boat});
        }
        else{
            const boat = {"volume": volume, "item": item, "creation_date": creation_date, "carrier":load_carrier, "public": public, "owner":load_owner};
            return datastore.save({"key":key, "data":boat});
        }
    }
}

async function delete_load(id){
    const id_str = id.toString();
    const key = datastore.key([LOAD, parseInt(id,10)]);
    const [load_ent] = await datastore.get(key);
    let load_carr = load_ent.carrier;
    if (load_carr === null || load_carr === undefined){
        return datastore.delete(key);
    }
    else{
        const b_key = datastore.key([BOAT, parseInt(load_carr,10)]);
        const [boat_ent] = await datastore.get(b_key);
        let boat_loads = boat_ent.loads;
        let updated_loads = boat_loads;
        if (boat_loads === null || boat_loads === undefined){
            return datastore.delete(key);
        }
        else{
            let loads_len = boat_loads.length;
            for (i=0; i < loads_len; i++){
                if (boat_loads[i] === id_str){
                    updated_loads = boat_loads.slice(i+1);
                    boat_ent.loads = updated_loads;
                    datastore.save({key:b_key,data:boat_ent});
                    break;
                }
            }
            return datastore.delete(key);
        }
    }
}

async function check_owner_load(user, lid){
    const l_key = datastore.key([LOAD, parseInt(lid,10)]);
    const [load_ent] = await datastore.get(l_key);
    const load_owner = load_ent.owner;
    console.log(load_owner == user);
    if (load_owner === user){
        return datastore.get(l_key).then((entity) => {
            if (entity[0] === undefined || entity[0] === null) {
                // No entity found. Don't try to add the id attribute
                return entity;
            } else {
                // Use Array.map to call the function fromDatastore. This function
                // adds id attribute to every element in the array entity
                return entity.map(ds.fromDatastore);
            }
        }); 
    }
    else{
        return null;
    }
}
/*--------- Helper Model Functions ------------ */
async function get_load_properties(bid, req){
    const key = datastore.key([LOAD, parseInt(bid,10)]);
    const [entity] = await datastore.get(key);
    if (entity === undefined || entity === null){
        return undefined;
    }
    let carrier = entity.carrier;
    if (carrier === null || carrier === undefined){
        let full_carrier = null;
        return [entity.volume, entity.item, entity.creation_date, full_carrier, entity.public, entity.owner];
    }
    else{
        let request_url =  req.protocol + "://" + req.get("host") + "/boats/" + carrier;
        let full_carrier = {id:carrier, self:request_url};
        return [entity.volume, entity.item, entity.creation_date, full_carrier, entity.public, entity.owner];
    }
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', checkJWT, function(req, res){
    if (req.user === null || req.user === undefined){
        console.log("no user");
        const loads = get_loads_unprotected(req).then( (loads)=>{
            res.status(200).json(loads);
        })
    }
    else{
        console.log("there is a user");
        const loads = get_loads(req,req.user.sub)
	.then( (loads) => {
        res.status(200).json(loads);
    });
    }
});

router.post('/',checkJWT, function(req, res){
    post_load(req.body.volume, req.body.item, req.body.creation_date, req.body.public, req.user.sub)
    .then(key => {
        if (req.body.volume == null || req.body.item == null || req.body.creation_date == null
            || req.body.public == null){
            res.status(400).json({ 'Error': 
            'The request object is missing at least one of the required attributes' });
        }
        else{
            let request_url =  req.protocol + "://" + req.get("host") + req.baseUrl +"/" + key.id;
            res.status(201).send('{ "id": ' + key.id + ',\n "volume": '  + req.body.volume +
                ',\n "item": ' + '"' + req.body.item + '"' + ',\n "creation_date": ' 
                + '"' + req.body.creation_date + '"' +
                ',\n "carrier": ' + null + ',\n "public": '+ req.body.public 
                +',\n "self": ' +'"' + request_url + '"' + '\n}');
        }});
});

router.get('/:id', checkJWT, async function(req,res){
    load_properties = await get_load_properties(req.params.id, req);
    get_load(req.params.id)
        .then(load => {
            if (load[0] === undefined || load[0] === null) {
                // The 0th element is undefined. This means there is no load with this id
                res.status(404).json({ 'Error': 'No load with this load_id exists' });
            } else {
                let request_url =  req.protocol + "://" + req.get("host") + req.baseUrl +"/" + req.params.id;
                let printURL = request_url.toString();
                // Return the 0th element which is the load with this id
                res.status(200).json({'id':req.params.id, 'volume': load_properties[0], 'item':load_properties[1],
                'creation_date': load_properties[2], 'carrier': load_properties[3], "public": load_properties[4], 
                "owner": load_properties[5],'self': printURL});
            }
        });
});

router.put('/:id',checkJWT, function(req, res){
    get_load(req.params.id).then((boat)=>{
        if (boat[0] === null || boat[0] === undefined){
            res.status(404).json({"Error":"No load with this load_id exists"});
        }
        else{
            check_owner_load(req.user.sub, req.params.id).then((chck_load) => {
                if (chck_load === null){
                    res.status(403).json({"Error": "Attempt at put editing another user's load"});
                }
                else{
                    put_load(req.params.id, req.body.volume, req.body.item, req.body.creation_date, req.body.public).then((ship) =>{
                        if (req.body.volume === null || req.body.volume === undefined || req.body.item === null ||
                            req.body.item === undefined || req.body.creation_date === undefined || req.body.creation_date === null
                            || req.body.public === null || req.body.public === undefined){
                                res.status(406).json({"Error":"Missing required name, type, and/or length parameters."});
                            }
                        else{
                            res.status(201).send();
                        }
                    });
                }
            })
        }
    })
});

router.patch('/:id', checkJWT, async function(req,res){
    console.log(req.body.item);
        if ((req.body.volume != null || req.body.volume != undefined) && 
        (req.body.item != null || req.body.item != undefined) &&
        (req.body.creation_date != null || req.body.creation_date != undefined) &&
        (req.body.public != null || req.body.public != undefined)){
            res.status(400).json({'Error': 'Only up to three attributes can be patched.'});
        }
        else if ((req.body.volume == null || req.body.volume == undefined) && 
        (req.body.item == null || req.body.item == undefined) &&
        (req.body.creation_date == null || req.body.creation_date == undefined) &&
        (req.body.public == null || req.body.public == undefined)){
            res.status(400).json({'Error': 'At least one attribute must be patched.'});
        }
        else{
            check_owner_load(req.user.sub, req.params.id).then((chck_load) =>{
                if (chck_load === null){
                    res.status(403).json({'Error': "Attempt to patch edit another user's load."});
                }
                else{
                    patch_load(req.params.id, req.body.volume, req.body.item, req.body.creation_date).then( async (boat) => {
                        if (boat == null || boat == undefined){
                            res.status(404).json({'Error': 'The load with the specified load ID could not be found.'});
                        }
                        else{
                            load_atts = await get_load_properties(req.params.id,req);
                            let request_url =  req.protocol + "://" + req.get("host") + req.baseUrl +"/" + req.params.id;
                            res.status(201).json({"id": req.params.id, "volume": load_atts[0], "item": load_atts[1],
                            "creation_date": load_atts[2], "carrier": load_atts[3], "public": load_atts[4], "self": request_url});
                        }
                });
            }
        })
    }
});

router.delete('/:id', checkJWT, function(req, res){
    get_load(req.params.id).then(load=>{
        if (load[0] === null || load[0] === undefined){
            res.status(404).json({'Error': 'No load with this load_id exists'});
        }
        else{
            check_owner_load(req.user.sub, req.params.id).then((chck_load) =>{
                if (chck_load === null){
                    res.status(403).json({'Error':"Attempt at deleting another user's load"});
                }
                else{
                    delete_load(req.params.id).then(res.status(204).send());
                }
            })
        }
    });
});

// router.put('/boats/:bid/loads/:lid', checkJWT, async function(req, res){
//     // const b_key = datastore.key([LOAD], parseInt(req.params.lid,10));
//     // const [bentity] = await datastore.get(b_key);
//     // let carrier_check = bentity.carrier;
//     put_shipments(req.params.bid, req.params.lid)
//     .then(boat => {
//         if (boat[0] === null || boat[0] === undefined){
//             res.status(404).json({'Error': "The specified boat and/or load does not exist"});
//         }
//         else{
//             put_package(req.params.bid, req.params.lid)
//             .then(load => {
//                 console.log(req.params.lid);
//                 if (load[0] === null || load[0] === undefined){
//                     res.status(404).json({'Error': "The specified boat and/or load does not exist"});
//                 }
//                 else if (load[0].carrier != null){
//                     res.status(403).json({'Error': "The load is already loaded on another boat"});
//                 }
//                 else{
//                     res.status(204).end();
//                 }
//             })
//         }
//     });
// });

router.use(function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        if (err.message === 'jwt expired'){
            res.status(401).json({"error" : err.name + ": " + "JWT Expired"})
        }
        else if (err.message === 'No authorization token was found'){
            res.status(401).json({"error" : err.name + ": " + err.message})   
        }
        else{
            res.status(401).json({"error" : err.name + ": " + "Invalid JWT Token"})
        }
    } else {
      next(err);
    }
});

/* ------------- End Controller Functions ------------- */

module.exports = router;