const express = require('express');
const bodyParser = require('body-parser');
const ds = require('./datastore');
const router = express.Router();
const datastore = ds.datastore;

const checkJwt = require('./checkJWT');

const USER = "User";

router.use(bodyParser.json());

/* ------------- Begin User Model Functions ------------- */
async function post_user(userID, nickname, email){
    var key = datastore.key(USER);
    const new_user = {userID: userID, nickname: nickname, email: email};
    return datastore.save({key:key, data: new_user}).then(() => {return key});
}

async function get_user_properties(id, req){
    const key = datastore.key([USER, parseInt(id,10)]);
    const [entity] = await datastore.get(key);
    if (entity === undefined || entity === null){
        return undefined;
    }
    return [entity.userID, entity.nickname, entity.email]; 
}

function get_user(id){
    const key = datastore.key([USER, parseInt(id, 10)]);
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

function get_users(req,){
    var q = datastore.createQuery(USER).limit(4);
    const results = {};
    if (Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
            results.users = entities[0].map(ds.fromDatastore);
            if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
            }
			return results;
		});
}


/* End Model Functions */
/* ------------- Begin Controller Functions ------------- */
router.post('/', checkJwt, function(req,res){
    post_user(req.user.sub, req.user.nickname, req.user.email).then(user=>{
        res.status(201).json({'ID': user.id, 'userID': req.user.sub, 'nickname':req.user.nickname, 'email':req.user.email});
    })
});

router.get('/:id', checkJwt, async function(req,res){
    get_user(req.params.id).then(async (user)=> {
        if (user[0] === null || user[0] === undefined){
            res.status(404).json({'Error': 'No user with this ID number was found'});
        }
        else{
            const user_ent = get_user_properties(req.params.id, req);
            res.status(200).json({'UserID':user_ent[0], 'nickname':user_ent[1], 'email':user_ent[2]});
        }
    })
});

router.get('/', checkJwt, function(req,res){
    get_users(req).then((users) =>{
        res.status(200).json(users);
    })
})

module.exports = router;