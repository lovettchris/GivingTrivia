using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MsftGivingTriviaWebApp.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            this.CheckUser();
            return View();
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