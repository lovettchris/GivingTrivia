using MsftGivingTriviaWebApp.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity;
using System.Threading.Tasks;
using System.Diagnostics;
using Microsoft.AspNet.Identity.Owin;
using System.Data.Entity;
using System.Text;

namespace MsftGivingTriviaWebApp.Controllers
{
    [Authorize]
    public class PlayController : Controller
    {
        public PlayController()
        {
        }


        // GET: Index
        public ActionResult Index()
        {
            this.CheckUser();
            return View();
        }

        // GET: Play
        public ActionResult Play(string id)
        {
            this.CheckUser();
            return View(new SelectGameModel() { GameId = id });
        }

        public ActionResult Categories()
        {
            // return the category list as json.
            List<string> categories = new List<string>();
            this.CheckUser();
            try
            {
                var context = this.HttpContext.GetOwinContext();
                var db = context.Get<ApplicationDbContext>();
                var table = db.Questions;

                categories.AddRange((from q in table select q.Category).Distinct());
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error querying categories: " + ex.Message);
            }

            // return the result as JSON data.
            var result = new JsonResult() {
                Data = categories,
                ContentEncoding = Encoding.UTF8,
                ContentType = "text/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
            return result;
        }


        public ActionResult Questions(string category)
        {
            // return the question list by category as json.
            List<QuestionModel> questions = new List<QuestionModel>();
            this.CheckUser();
            object data = null;
            try
            {
                var context = this.HttpContext.GetOwinContext();
                var db = context.Get<ApplicationDbContext>();
                var table = db.Questions;

                questions.AddRange(from q in table where q.Category == category select q);
                data = questions;
            }
            catch (Exception ex)
            {
                data = "Error querying categories: " + ex.Message;
            }

            // return the result as JSON data.
            var result = new JsonResult()
            {
                Data = data,
                ContentEncoding = Encoding.UTF8,
                ContentType = "text/json",
                MaxJsonLength = 1000000,
                JsonRequestBehavior = JsonRequestBehavior.AllowGet
            };
            return result;
        }
    }
}