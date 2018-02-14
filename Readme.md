## Setup

To deploy to Azure you need to first create a SQL Database, then edit the web.config to plug in the ConnectionString to that
database, it should look something like this:

````
    <add name="DefaultConnection" connectionString="Server=tcp:msftgivingtriviawebappdbserver.database.windows.net,1433;Initial Catalog=MsftGivingTriviaDb;Persist Security Info=False;User ID={your_username};Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"  providerName="System.Data.SqlClient" />
````

Simply plug in your real user name and password.  To test using local instance of IIS you need to also open the firewall
to this database which you can do from the SQL Database Portal tool bar item "Set server firewall".  This page will tell you
what your public IP address is so you can add a rule for it, then your local testing will be using the same database that
the deployed app will be using.


## Updating Database Schema

To modify the database schema you simply add a new entity

see [migrations and deployment with the entity framework](https://docs.microsoft.com/en-us/aspnet/mvc/overview/getting-started/getting-started-with-ef-using-mvc/migrations-and-deployment-with-the-entity-framework-in-an-asp-net-mvc-application).

Essentially it boils down to the following Package Manager Console commands:

````
add-migration
update-database
````





