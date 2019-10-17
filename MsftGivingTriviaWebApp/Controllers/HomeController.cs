using Microsoft.AspNet.Identity.Owin;
using MsftGivingTriviaWebApp.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MsftGivingTriviaWebApp.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index(HomePageCustomizeModel model)
        {
            this.CheckUser();
            var existing = GetModel();
            if (existing != null)
            {
                model.CopyFrom(existing);
            }
            model.SetPlaceHolders();
            return View(model);
        }

        private HomePageCustomizeModel GetModel()
        {
            HomePageCustomizeModel existing = null;
            Guid homePageGuid = typeof(HomePageCustomizeModel).GUID;
            var context = this.HttpContext.GetOwinContext();
            var db = context.Get<ApplicationDbContext>();

            // populate existing data into the form
            var homePageCustomizations = (from i in db.Customizations where i.Id == homePageGuid select i).FirstOrDefault();
            if (homePageCustomizations != null)
            {
                string blobMame = homePageCustomizations.JsonBlobId;
                existing = CustomizationBlobs.GetCustomizationJson<HomePageCustomizeModel>(blobMame);                
            }
            return existing;
        }

        public ActionResult Icon(string name)
        {
            this.CheckUser();
            var existing = GetModel();
            if (existing != null)
            {
                string blobName = null;
                if (name == existing.IconUrl1)
                {
                    blobName = "FileIcon1";
                }
                else if (name == existing.IconUrl2)
                {
                    blobName = "FileIcon2";
                }
                if (!string.IsNullOrEmpty(blobName))
                {
                    try
                    {
                        string ext = System.IO.Path.GetExtension(name);
                        byte[] data = CustomizationBlobs.GetBlob(blobName);
                        return base.File(data, "image/" + ext);
                    }
                    catch
                    {
                        // hmmm
                    }
                }
            }
            return base.File(Server.MapPath("/content/icon3.png"), "image/png");
        }

        public ActionResult About()
        {
            this.CheckUser();
            ViewBag.Message = "Giving Trivia";
            return View();
        }

        public ActionResult Contact()
        {
            this.CheckUser();
            ViewBag.Message = "Giving Trivia - Contacts";
            return View();
        }


        public ActionResult Help()
        {
            this.CheckUser();
            ViewBag.Message = "Giving Trivia - Help";
            return View();
        }

    }
}