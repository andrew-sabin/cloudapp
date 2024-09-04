const express = require('express');
const bodyParser = require('body-parser');
const ds = require('./datastore');
const router = express.Router();
const datastore = ds.datastore;

const checkJwt = require('./checkJWT');

const BOAT = "Boat";
const LOAD = "Load";


router.use(bodyParser.json());


/* ------------- Begin Boat Model Functions ------------- */
function post_boat(name, type, length, public, owner){
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length, "public": public, "owner": owner};
	return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}

async function get_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
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

function get_boats(req, owner){
    var q = datastore.createQuery(BOAT).limit(4);
    const results = {};
    if (Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.boats = entities[0].map(ds.fromDatastore).filter(item => item.owner === owner);
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}

function get_boats_unprotected(req){
    var q = datastore.createQuery(BOAT).limit(4);
    const results = {};
    if (Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.boats = entities[0].map(ds.fromDatastore).filter(item => item.public === true);
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}


async function get_boat_loads(req, id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const [boat_ent] = await datastore.get(key);
    console.log(boat_ent);
    if (boat_ent === null || boat_ent === undefined){
        return;
    }
    else{
        return datastore.get(key)
    .then( (boats) => {
        if (boats === undefined || boats === null){
            return;
        }
        const boat = boats[0];
        const load_keys = boat.loads.map( (g_id) => {
            return datastore.key([LOAD, parseInt(g_id,10)]);
        });
        return datastore.get(load_keys);
    })
    .then((loads) => {
        loads = loads[0].map(ds.fromDatastore);
        return loads;
    });
    }
}

async function put_boat(id, name, type, length, public){
    if (name === null || name === undefined || type === null || type === undefined || length === null ||
        length === undefined || public === undefined || public === null){
            return;
    }
    else{
        const key = datastore.key([BOAT, parseInt(id,10)]);
        const [boat_ent] = await datastore.get(key);
        const boat_loads = boat_ent.loads;
        const boat_owner = boat_ent.owner;
        if (boat_loads === null || boat_loads === undefined){
            const boat = {"name": name, "type": type, "length": length, "public": public, "owner":boat_owner};
            return datastore.save({"key":key, "data":boat});
        }
        else{
            const boat = {"name": name, "type": type, "length": length, "loads":boat_loads, "public": public, "owner":boat_owner};
            return datastore.save({"key":key, "data":boat});
        }
    }
}

async function patch_boat(id, name, type, length, public){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const [entity] = await datastore.get(key);
    let boat;
    let boat_name;
    let boat_type;
    let boat_length;
    let boat_public;
    if (entity == undefined){
        return;
    }
    if (name == null || name == undefined){
        boat_name = entity.name;
    }
    else{
        boat_name = name;
    }
    if (type == null || type == undefined){
        boat_type = entity.type;
    }
    else {
        boat_type = type;
    }
    if (length == null || length == undefined){
        boat_length = entity.length;
    }
    else {
        boat_length = length;
    }
    if (public == null || public == undefined){
        boat_public = entity.public;
    }
    else {
        boat_public = public;
    }
    boat = {"name": boat_name, "type": boat_type, "length": boat_length, 
    "owner":entity.owner, "public": boat_public}
    return datastore.save({"key": key, "data":boat});
}

async function delete_boat(id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const [boat_ent] = await datastore.get(key);
    let load_list = boat_ent.loads;
    if (load_list === null || load_list === undefined){
        return datastore.delete(key);
    }
    else{
        let load_len = load_list.length;
        for (i = 0; i < load_len; i++){
            let curr_load = load_list[i];
            const l_key = datastore.key([LOAD, parseInt(curr_load,10)]);
            const [load_ent] = await datastore.get(l_key);
            load_ent.carrier = null;
            datastore.save({key:l_key,data:load_ent});
        }
        return datastore.delete(key);
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

async function check_owner_boat(user, bid){
    const b_key = datastore.key([BOAT, parseInt(bid,10)]);
    const [boat_ent] = await datastore.get(b_key);
    const boat_owner = boat_ent.owner;
    console.log(boat_owner == user);
    if (boat_owner === user){
        return datastore.get(b_key).then((entity) => {
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


//put function for placing a load onto a ship
async function put_shipments(bid, lid){
    const b_key = datastore.key([BOAT, parseInt(bid,10)]);
    return datastore.get(b_key)
    .then( async (boat) => {
        if (boat[0] === undefined || boat[0] === null ){
            return;
        }
        if( boat[0].loads === undefined || boat[0].loads === null){
            boat[0].loads = [];
            boat[0].loads.push(lid);
            return datastore.save({"key":b_key, "data":boat[0]});
        }
        else{
            const [bentity] = await datastore.get(b_key);
            const b_loads = bentity.loads;
            let load_len = b_loads.length;
            let to_find = lid.toString();
            let is_found = false;
            for (i = 0; i < load_len; i++){
                if (b_loads[i] == to_find){
                    is_found = true;
                    break;
                }
            }
            if (is_found === false){
                boat[0].loads.push(lid);
                return datastore.save({"key":b_key, "data":boat[0]});
            }
            else{
                return datastore.save({"key":b_key, "data":boat[0]});
            }
        }  
    });
}

// put function for updating the carrier of the load
async function put_package(bid,lid){
    const l_key = datastore.key([LOAD, parseInt(lid,10)]);
    const [lentity] = await datastore.get(l_key);
    if (lentity === null || lentity === undefined){
        return;
    }
    const carrier_check = lentity.carrier;
    console.log(carrier_check);
    return datastore.get(l_key)
    .then(async(load)=>{
        if (carrier_check === null || carrier_check === undefined){
            load[0]['carrier'] = bid;   
            return await datastore.save({key:l_key, data:load[0]});     
        }
        else{
            console.log('carrier found \n');
            return;
        }
    })
}

async function remove_ship(lid, bid){
    const l_key = datastore.key([LOAD, parseInt(lid,10)]);
    const [lentity] = await datastore.get(l_key);
    if (lentity === null || lentity === undefined){
        return;
    }
    const carrier_check = lentity.carrier;
    return datastore.get(l_key)
    .then(async(load)=>{
        if (carrier_check === bid){
            load[0]['carrier'] = null;   
            return await datastore.save({key:l_key, data:load[0]});     
        }
        else{
            return await datastore.save({key:l_key, data:load[0]});
        }
    })
}

async function find_load(lid,bid){
    const b_key = datastore.key([BOAT, parseInt(bid,10)]);
    const [bentity] = await datastore.get(b_key);
    const b_loads = bentity.loads;
    const load_len = b_loads.length;
    let was_found = false;
    let to_find = lid.toString();
    for (i = 0; i < load_len; i++){
        if (b_loads[i] == to_find){
            was_found = true;
            break;
        }
    }
    return was_found;
}

async function remove_load(lid,bid){
    const b_key = datastore.key([BOAT, parseInt(bid,10)]);
    const [bentity] = await datastore.get(b_key);
    if (bentity === null || bentity === undefined){
        return;
    }
    const l_key = datastore.key([BOAT, parseInt(bid,10)]);
    const b_loads = bentity.loads;
    let update_loads = b_loads;
    let load_len = b_loads.length;
    let to_find = lid.toString();
    let was_found = false;
    for (i = 0; i < load_len; i++){
        if (b_loads[i] == to_find){
            update_loads = b_loads.slice(i+1);
            was_found = true;
            break;
        }
    }
    if (update_loads === undefined || update_loads === null){
        update_loads = [];
    }
    console.log(update_loads);
    // console.log(b_loads);
    // let b_filtered = b_loads.filter(toString(lid));
    return await datastore.get(b_key).then(async(boat) => {
        if (was_found === true){
            const newBoat = {
                "name": boat[0].name,
                "volume": boat[0].volume,
                "length": boat[0].length,
                "type": boat[0].type,
                "loads": update_loads
            };
            return await datastore.save({key:b_key, data:newBoat})
        }
        else{
            return;
        }
        
    })

}

async function get_load(lid) {
    const key = datastore.key([LOAD, parseInt(lid, 10)]);
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

async function get_boat_properties(bid, req){
    const key = datastore.key([BOAT, parseInt(bid,10)]);
    const [entity] = await datastore.get(key);
    if (entity === undefined || entity === null){
        return undefined;
    }
    const b_loads = entity.loads;
    let load_len = 0;
    if (b_loads === undefined || b_loads === null){
        load_len = 0;
    }
    else{
        load_len = b_loads.length;
    }
    let load_lst = [];

    for (i = 0; i < load_len; i++){
        let curr_load = b_loads[i];
        let request_url =  req.protocol + "://" + req.get("host") + "/loads/" + curr_load;
        let load_json = {id:curr_load, self:request_url};
        load_lst.push(load_json);
        }
    return [entity.name, entity.type, entity.length, load_lst, entity.public, entity.owner] 
}

/* ------------- End Model Functions ------------- */

/*-------------- Helper Model Functions ---------- */

// async function get_boat_properties(id){
//     const key = datastore.key([BOAT, parseInt(id,10)]);
//     const [entity] = await datastore.get(key);
//     if (entity === undefined || entity === null){
//         return undefined;
//     }
//     return [entity.name, entity.type, entity.length];
// }

// async function test_name(insert_name){
//     const boat_list = await get_boats();
//     for (let i = 0; i < boat_list.length; i++){
//         let curr_boat = boat_list[i];
//         if (curr_boat.name === insert_name){
//             return true;
//         }
//     }
//     return false;
// }

// async function test_name_props(insert_name){
//     if ((typeof insert_name) !== 'string'){
//         return false;
//     }
//     let char_array = ['!','@','#','$','%','^','&','*','(',')','+','{','}','"',';',',','.',"'",'?','/','|','=','~','`',']','[','\n'];
//     for (let i = 0; i < char_array.length; i++){
//         if (insert_name.includes(char_array[i])){
//             return false;
//         }
//     }
//     if (insert_name.length > 0 && insert_name.length <= 30){
//         return true;
//     }
//     else{
//         return false;
//     }
// }

// async function test_type_props(insert_type){
//     if ((typeof insert_type) !== 'string'){
//         return false;
//     }
//     let char_array = ['!','@','#','$','%','^','&','*','(',')','+','{','}','"',';',',','.',"'",'?','/','|','=','~','`',']','[','\n'];
//     for (let i = 0; i < char_array.length; i++){
//         if (insert_type.includes(char_array[i])){
//             return false;
//         }
//     }
//     if (insert_type.length > 0 && insert_type.length <= 30){
//         return true;
//     }
//     else{
//         return false;
//     }
// }

// async function test_length_props(insert_length){
//     if ((typeof insert_length) !== 'number'){
//         return false;
//     }
//     else if (insert_length > 0 && insert_length <=10000){
//         return true;
//     }
//     else{
//         return false;
//     }
// }

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', checkJwt, function(req, res){
    if (req.user === null || req.user === undefined){
        const boats = get_boats_unprotected(req).then( (boats) => {
        res.status(200).json(boats);
    });
    }
    else{
        get_boats(req,req.user.sub).then((boats) => {
            res.status(200).json(boats);
        });
    }  
});

router.get('/:id', async function(req,res){
    //console.log(req.params.id);
    boat_properties = await get_boat_properties(req.params.id,req);
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no boat with this id
                res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
            } else {
                let request_url =  req.protocol + "://" + req.get("host") + req.baseUrl +"/" + req.params.id;
                let printURL = request_url.toString();
                // Return the 0th element which is the boat with this id
                res.status(200).json({'id':req.params.id, 'name': boat_properties[0], 'type':boat_properties[1],
                'length': boat_properties[2], 'loads': boat_properties[3], 'public': boat_properties[4], 
                'owner': boat_properties[5], 'self': printURL});
            }
        });
});

router.get('/:id/loads', checkJwt, function(req, res){
    const boats = get_boat_loads(req, req.params.id)
	.then( (boats) => {
        if (boats === null || boats === undefined){
            res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        }
        else{
            res.status(200).json(boats);
        }
        
    });
});

router.post('/', checkJwt, function (req, res) {
    post_boat(req.body.name, req.body.type, req.body.length, req.body.public, req.user.sub)
        .then(key => {
            if (req.body.name == null || req.body.type == null || req.body.length == null|| 
                req.body.public == null){
                res.status(400).json({ 'Error': 
                'The request object is missing at least one of the required attributes' });
            }
            else{
                let request_url =  req.protocol + "://" + req.get("host") + req.baseUrl +"/" + key.id; 
                res.status(201).send('{ "id": ' + key.id + ',\n "name": ' + '"' + req.body.name + '"' +
                    ',\n "type": ' + '"' + req.body.type + '"' + ',\n "length": ' + req.body.length +
                    ',\n "loads": ' + '[] ' + ',\n "public": ' + req.body.public + 
                    ',\n "self": ' +'"' + request_url + '"' + '\n}');
            }});
});

router.patch('/:id',checkJwt, async function(req,res){
        if ((req.body.name != null || req.body.name != undefined) && 
        (req.body.type != null || req.body.name != undefined) &&
        (req.body.length != null || req.body.length != undefined) &&
        (req.body.public != null || req.body.public != undefined)){
            res.status(400).json({'Error': 'Only up to two attributes can be patched.'});
        }
        else if((req.body.name == null || req.body.name == undefined) && 
        (req.body.type == null || req.body.name == undefined) &&
        (req.body.length == null || req.body.length == undefined) &&
        (req.body.public == null || req.body.public == undefined)){
            res.status(400).json({'Error': 'At least one attribute must be patched.'});
        } 
        else{
            check_owner_boat(req.user.sub, req.params.id).then((chck_boat) =>{
                if (chck_boat === null){
                    res.status(403).json({'Error': "Attempt at patch editing another user's boat"});
                }
                else{
                    patch_boat(req.params.id, req.body.name, req.body.type, req.body.length, req.body.public).then( async (boat) => {
                        if (boat == null || boat == undefined){
                            res.status(404).json({'Error': 'The boat with the specified boat ID could not be found.'});
                        }
                        else{
                            boat_atts = await get_boat_properties(req.params.id,req);
                            let request_url =  req.protocol + "://" + req.get("host") + req.baseUrl +"/" + req.params.id;
                            res.status(201).json({"id": req.params.id, "name": boat_atts[0], "type": boat_atts[1],
                            "length": boat_atts[2], "loads": boat_atts[3], "public": boat_atts[4],
                            "owner":boat_atts[5], "self": request_url});
                        }});
                }
            });
        }
    });


router.put('/:id', checkJwt, function(req, res){
    get_boat(req.params.id).then((boat)=>{
        if (boat[0] === null || boat[0] === undefined){
            res.status(404).json({"Error":"No boat with this boat_id exists"});
        }
        else{
            check_owner_boat(req.user.sub, req.params.id).then((chck_boat)=>{
                if (chck_boat === null){
                    res.status(403).json({'Error': "Attempt at put editing another user's boat"})
                }
                else{
                    put_boat(req.params.id, req.body.name, req.body.type, req.body.length, req.body.public).then((ship) =>{
                        if (req.body.name === null || req.body.name === undefined || req.body.type === null ||
                            req.body.type === undefined || req.body.length === undefined || req.body.length === null
                            || req.body.public === null || req.body.public === undefined){
                                res.status(403).json({"Error":"Missing required name, type, and/or length parameters."});
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

router.put('/:bid/loads/:lid',checkJwt, async function(req, res){
    get_load(req.params.lid).then(load => {
        if (load[0] === null || load[0] === undefined){
            res.status(404).json({'Error': "The specified boat and/or load does not exist"});
        }
        else{
            check_owner_load(req.user.sub,req.params.lid).then((chck_load) => {
                if (chck_load === null){
                    res.status(403).json({'Error': "Attempt at loading another user's boat"});
                }
                else{
                    check_owner_boat(req.user.sub, req.params.bid).then((chck_boat) =>{
                        if(chck_boat === null){
                            res.status(403).json({'Error': "Attempt at loading another user's boat"});
                        }
                        else{
                            get_boat(req.params.bid).then(boat =>{
                                if (boat[0] === null || boat[0] === undefined){
                                    res.status(404).json({'Error': "The specified boat and/or load does not exist"});
                                }
                                else{
                                    put_package(req.params.bid, req.params.lid).then((load) => {
                                        if (load === undefined || load === null){
                                            res.status(403).json({'Error': "The load is already loaded on another boat"});
                                        }
                                        else if (load[0] === null || load[0] === undefined){
                                            res.status(404).json({'Error': "The specified boat and/or load does not exist"});
                                        }
                                        else{
                                            // console.log("putting load info on ship\n");
                                            put_shipments(req.params.bid, req.params.lid).then((boat) =>{
                                                if (boat === null || boat === undefined){
                                                    res.status(404).json({'Error': "The specified boat and/or load does not exist"});
                                                }
                                                if (boat[0] === null || boat[0] === undefined){
                                                    res.status(404).json({'Error': "The specified boat and/or load does not exist"});
                                                }
                                                else{
                                                    res.status(204).end();
                                                }
                                            })
                                        }
                                    })
                                }
                            });
                        }
                    })
                }
            })
        }
    });
});

router.delete('/:bid/loads/:lid', checkJwt, async function(req,res){
    get_load(req.params.lid).then(load => {
        if (load[0] === null || load[0] === undefined){
            res.status(404).json({'Error': "No boat with this boat_id is loaded with the load with this load_id"});
        }
        else{
            check_owner_load(req.user.sub, req.params.lid).then((chck_load)=>{
                if (chck_load === null){
                    res.status(403).json({'Error':"User Attempted to Remove Other User's Load"});
                }
                else{
                    get_boat(req.params.bid).then(boat =>{
                        if (boat[0] === null || boat[0] === undefined){
                            res.status(404).json({'Error': "No boat with this boat_id is loaded with the load with this load_id"});
                        }
                        else{
                            check_owner_boat(req.user.sub, req.params.bid).then((chck_boat) =>{
                                if(chck_boat === null){
                                    res.status(403).json({'Error': "Attempt at loading another user's boat"});
                                }
                                else{
                                    remove_ship(req.params.lid,req.params.bid).then((load) => {
                                        if (load === null || load === undefined){
                                            res.status(404).json({'Error': "No boat with this boat_id is loaded with the load with this load_id"});
                                        }
                                        else if (load[0] === null || load[0] === undefined){
                                            res.status(404).json({'Error': "The specified boat and/or load does not exist"});
                                        }
                                        else{
                                            remove_load(req.params.lid,req.params.bid).then((boat) => {
                                                if (boat === null || boat === undefined){
                                                    res.status(404).json({'Error': "No boat with this boat_id is loaded with the load with this load_id"});
                                                }
                                                else if(boat[0] === null || boat[0] === undefined){
                                                    res.status(404).json({'Error': "The specified boat and/or load does not exist"});
                                                }
                                                else{
                                                    res.status(204).end();
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    });
                }
            })
        }
    });

})

router.delete('/:id', checkJwt, function(req, res){
    get_boat(req.params.id).then(load=>{
        if (load[0] === null || load[0] === undefined){
            res.status(404).json({'Error': 'No boat with this boat_id exists'});
        }
        else{
            check_owner_boat(req.user.sub, req.params.id).then((chck_boat) =>{
                if(chck_boat === null){
                    res.status(403).json({'Error': "Attempt at deleting another user's boat"});
                }
                else{
                    delete_boat(req.params.id).then(res.status(204).send());
                }
        
            });
        }
    });
});

router.use(function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        if (err.message === 'jwt expired'){
            res.status(401).json({"Error" : err.name + ": " + "JWT Expired"})
        }
        else if (err.message === 'No authorization token was found'){
            res.status(401).json({"Error" : err.name + ": " + err.message})   
        }
        else{
            res.status(401).json({"Error" : err.name + ": " + "Invalid JWT Token"})
        }
    } else {
      next(err);
    }
});

/* ------------- End Controller Functions ------------- */

module.exports = router;