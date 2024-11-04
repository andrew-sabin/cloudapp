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

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/logged%20in%202.png)

## Loads

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/logged%20in%202.png)

## Assigning Loads to Boats

![screenshot](https://raw.githubusercontent.com/andrew-sabin/cloudapp/refs/heads/main/screenshots/main%20page/logged%20in%202.png)
