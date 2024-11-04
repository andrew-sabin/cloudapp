# cloudapp
Portfolio Project For Cloud Application Development at Oregon State University

# Full Description
Created a server application where users can create, read, update, and delete different different boats and load. 

It checks to make sure that each boat and load is created by the specific user by making sure that the JWT matches the user with their specific float and boat.

The application is hosted on Google Cloud Services and uses Google Datastore to store JSON Data.

## Creating an Account

Step 1.) Head to the main site at: https://sabinand-portfolio.uc.r.appspot.com/

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/logged%20out.png)

Step 2.) At the end of the url put in: /login

Step 3.) Create an account or sign in with the sign in page:

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/auth0%20signin.png) 

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/auth0%20signup.png) 

You should get a resulting page like this:

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/logged%20in%202.png)

To signout add "/logout" to the end of the url.

# Postman Tests

Due to the application being server only, I used Post-man tests to test for issues that might occur with the application.

## Users

After signing up, users can get custom JWT tags that will allow them to edit their own boats and floats.

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/users/JWT%20User%201.png)

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/users/JWT%20Token%201%20Payload%20Data.png?raw=true)

What the decrypted JWT tag provides.

## Boats
Users can create, read, update and delete various boats.

POST Request For A Boat:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/adding%20boats/POST%20Request.png?raw=true)

Resulting Creation:
![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/adding%20boats/JWT%20Boat%201.png?raw=true)

Google Datastore:
![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/adding%20boats/JWT%20Boat%201.2.png?raw=true)

## Loads
Users can create, read, update, and delete various loads.

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loads/POST%20Load.png?raw=true)

Resulting Creation:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loads/JWT1_GetLoad1_No_carry.png?raw=true)

Google Datastore:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loads/Loads_GDS.png?raw=true)

## Assigning Load to Boat
Users can load items onto boats.

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loading%20onto%20boats/PUT%20Load%20on%20Boat.png?raw=true)

Note: {app_url} is the website url, and the boat_id is the boat the load with the corresponding load_id is putting on.

Postman result:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loading%20onto%20boats/Loading%20a%20Boat%20Example.png?raw=true)

Google Datastore:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loading%20onto%20boats/Loading%20a%20Boat%20Example%20GDS.png?raw=true)

## Assigning Multiple Loads to the Same Boat
Users can also assign multiple loads to the same boat

Postman:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loading%20onto%20boats/boat%20with%20multiple%20loads%20PM.png?raw=true)

Google Datastore:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loading%20onto%20boats/boat%20with%20multiple%20loads.png?raw=true)

## Pagination
Users can see all the boats created with a GET request of /boats:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/boats%20pagination%2001.png?raw=true)
![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/boats%20pagination%2002.png?raw=true)

GET request for /loads:

![screenshot](https://github.com/andrew-sabin/cloudapp/blob/main/screenshots/loads%20pagination.png?raw=true)
