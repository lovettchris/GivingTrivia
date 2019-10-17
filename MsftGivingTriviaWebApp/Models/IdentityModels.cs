using System.Data.Entity;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using System.ComponentModel.DataAnnotations.Schema;
using System;
using System.Diagnostics;

namespace MsftGivingTriviaWebApp.Models
{
    // You can add profile data for the user by adding more properties to your ApplicationUser class, please visit https://go.microsoft.com/fwlink/?LinkID=317594 to learn more.
    public class ApplicationUser : IdentityUser
    {
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, DefaultAuthenticationTypes.ApplicationCookie);
            // Add custom user claims here
            return userIdentity;
        }
    }

    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        static string ConnectionStringId = "DefaultConnection";

        public ApplicationDbContext()
            : base(ConnectionStringId, throwIfV1Schema: false)
        {
        }

        static bool deleteDatabase = false;

        public static ApplicationDbContext Create()
        {
            if (System.Environment.GetEnvironmentVariable("USERNAME") == "clovett")
            {
                ConnectionStringId = "LocalConnection";
                var context = new ApplicationDbContext();
                if (deleteDatabase)
                {
                    // reset the database completely for a clean local test run from scratch.
                    deleteDatabase = false;
                    try
                    {
                        if (context.Database.Exists())
                        {
                            context.Database.Delete();
                        }
                    }
                    catch (Exception e)
                    {
                        Debug.WriteLine("Error deleting local database: " + e.Message);
                    }
                    try
                    {
                        context.Database.CreateIfNotExists();
                    }
                    catch (Exception e)
                    {
                        Debug.WriteLine("Error creating local database: " + e.Message);
                    }
                }
                return context;
            }
            return new ApplicationDbContext();
        }

        public DbSet<SharedAppConfig> Config { get; set; }

        public DbSet<QuestionModel> Questions { get; set; }

        public DbSet<CustomizationsModel> Customizations { get; set; }
    }

    [Table("AspSharedConfig")]
    public class SharedAppConfig
    {
        public SharedAppConfig() { }
        public string Id { get; set; }
        public string Value { get; set; }
    }

}