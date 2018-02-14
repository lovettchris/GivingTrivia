using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using MsftGivingTriviaWebApp.Models;

namespace MsftGivingTriviaWebApp.Controllers
{
    public static class ControllerExtensions
    {

        public static void CheckUser(this Controller c)
        {
            string userid = null;
            if (c.Request.IsAuthenticated)
            {
                userid = c.User.Identity.GetUserName();
                c.ViewBag.UserName = userid;

                var isAdmin = false;
                if (c.Session["IsAdmin"] == null)
                {
                    isAdmin = c.GetUserManager().IsInRole(c.User.Identity.GetUserId(), "admin");
                    c.Session["IsAdmin"] = isAdmin;
                }
                else
                {
                    isAdmin = (bool)c.Session["IsAdmin"];
                }            
                c.ViewBag.IsAdmin = isAdmin;

                // get the firebase API key
                try
                {
                    var key = c.Session["apikey"];
                    if (key == null)
                    {
                        var context = c.HttpContext.GetOwinContext();
                        var db = context.Get<ApplicationDbContext>();
                        var table = db.Config;
                        SharedAppConfig config = table.Find("ApiKey");
                        if (config != null)
                        {
                            key = config.Value;
                            c.Session["apikey"] = key;
                        }
                    }
                    c.ViewBag.ApiKey = key;

                }
                catch (Exception)
                {
                    // hmmm, the table is still missing...
                }
            }
            else
            {
                c.ViewBag.IsAdmin = false;
                c.ViewBag.UserName = "";
            }
        }

        public static ApplicationUserManager GetUserManager(this Controller c)
        {
            return c.HttpContext.GetOwinContext().GetUserManager<ApplicationUserManager>();
        }

    }
}