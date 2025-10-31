# Welcome to Artha Job Board

The **Artha Job Board app**  automates the process of importing, processing, and tracking large job data files efficiently.  It is a full-stack system built with **Node.js (Express)** on the backend and **React/Next.js** on the frontend.  The backend uses **Bull Queue** with **Redis**  and to handle background processing without blocking the main server thread. It Converts the XML file to the json and process the Jobs using Bull Queue (Redis) for effecient Operation and It uses the Nodejs Cron For automatic time to time Job processing and Reduce direct Database shoot.


# What Does This App Do ?

This application allow users to :
The **app** is designed to streamline and automate data ingestion workflows for organizations.  
It accepts an API endpoint that returns data in **XML format**, automatically converts the XML response into **JSON**, and processes it through a **Redis-powered Bull queue** for efficient and reliable job handling.

The system supports **scheduled imports** (e.g., every 1 or 2 hours—fully customizable by the user) to ensure continuous and up-to-date data synchronization.  
Once processed, all data is stored securely in the **database**, and the client interface provides clear visibility into:
-    Total jobs imported
-    Jobs updated
-    Failed jobs
-    Updated jobs 
-    Time and Date 
By automating the entire workflow, this system significantly reduces manual effort, ensures data consistency, and enhances operational efficiency across the organization

## Setup Instruction
 Clone the Repository
 ```bash 
 git clone https://github.com/Rohitsinghkhetwal/Artha.git
 
 ## npm install on root directory
 npm install
 Create config.env file 
 ## Copy these files and paste it 
 PORT=4000
MONGO_URI=<Your atlas>
REDIS_HOST=<Host>
REDIS_PORT=<port>
REDIS_USERNAME=<name>
REDIS_PASSWORD=<Password>
BATCH_SIZE=10
CRON_SCHEDULE=0 * * * *

## Please set up Redis Cloud and Atlas
copy Redis username and password from redis CLI

## Open terminal
run npm run dev

## Open Second terminal
run npm run dev:worker

## Voila you Started the backend App.
```

# Client Setup .

Clone Frontend Repository 
```bash
git clone https://github.com/Rohitsinghkhetwal/Artha-Frontend.git

## navigate inside the Nextjs folder structure 
run npm install

## create .env file in root directory

## paste this
NEXT_PUBLIC_URL=http://localhost:4000

## run this command
run npm run dev


## Now we can test the app 

```
## Assumptions
- The provided API endpoint returns **valid XML data** with a consistent structure.
-  The system assumes **Redis** and **MongoDB** (or the configured database) are properly installed, running,       and accessible.
- The scheduler (e.g., cron job or queue worker) runs continuously on the server to trigger the import process at defined time intervals. ( User can modify the time intervals like 1 hour , 3 hour or 1 day )
-   Network stability and API availability are maintained to ensure smooth imports.
-  env file are configured properly .
-  The user defines the **import interval** (e.g., hourly, every 2 hours) according to business requirements
-  Given API are having different XML content over  time  in case of new jobs retrieval . 
 