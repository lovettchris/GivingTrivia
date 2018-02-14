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
using System.IO;
using System.Text;
using System.Xml;
using Microsoft.Xml;
using System.Xml.Linq;

namespace MsftGivingTriviaWebApp.Controllers
{
    [Authorize]
    public class AdminController : Controller
    {
        public AdminController()
        {
        }
        

        // GET: Play
        public ActionResult Index()
        {
            this.CheckUser();
            ViewBag.Message = "";
            return View();
        }

        string GetChildValue(XElement row, string name)
        {
            XElement child = row.Element(name);
            if (child != null)
            {
                return child.Value;
            }
            return null;
        }

        List<string> GetCategories()
        {

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
            return categories;
        }

        [HttpPost]
        public async Task<ActionResult> UploadQuestions()
        {
            this.CheckUser();
            ViewBag.Message = "Upload";
            if (!ViewBag.IsAdmin)
            {
                ViewBag.Message = "You do not have admin permission";
            }
            else
            {
                int count = 0;
                StringWriter log = new StringWriter();
                foreach (string file in Request.Files)
                {
                    HttpPostedFileBase upload = Request.Files.Get(file);
                    string category = Path.GetFileNameWithoutExtension(upload.FileName);

                    if (upload != null)
                    {
                        var context = this.HttpContext.GetOwinContext();
                        var db = context.Get<ApplicationDbContext>();

                        List<QuestionModel> newQuestions = new List<QuestionModel>();
                        using (XmlCsvReader reader = new XmlCsvReader(upload.InputStream, Encoding.UTF8,
                            new Uri(file, UriKind.Relative), new NameTable()))
                        {
                            reader.FirstRowHasColumnNames = false;
                            reader.ColumnNames = new string[] { "Question", "Answer", "Wrong1", "Wrong2", "Wrong3" };
                            reader.Delimiter = ',';

                            XDocument doc = XDocument.Load(reader);
                            foreach (XElement row in doc.Root.Elements())
                            {
                                var table = db.Config;
                                QuestionModel model = new QuestionModel()
                                {
                                    Id = Guid.NewGuid(),
                                    Category = category,
                                    Question = GetChildValue(row, "Question"),
                                    Answer = GetChildValue(row, "Answer"),
                                    Wrong1 = GetChildValue(row, "Wrong1"),
                                    Wrong2 = GetChildValue(row, "Wrong2"),
                                    Wrong3 = GetChildValue(row, "Wrong3")
                                };
                                if (model.Question == "Question" &&
                                    model.Answer == "Answer")
                                {
                                    // skip it, this is the row header
                                }
                                else
                                {
                                    newQuestions.Add(model);
                                }
                            }
                        }

                        // remove the old questions in this category
                        var oldQuestions = (from q in db.Questions where q.Category == category select q);
                        int oldCount = oldQuestions.Count();
                        db.Questions.RemoveRange(oldQuestions);

                        // add the new questions.
                        db.Questions.AddRange(newQuestions);
                        count = newQuestions.Count;

                        // update the database!
                        await db.SaveChangesAsync();

                        if (oldCount > 0)
                        {
                            if (count == 0)
                            {
                                ViewBag.Message = "Deleted " + oldCount + " questions in the " + category + " category";
                            }
                            else
                            {
                                ViewBag.Message = "Replaced " + oldCount + " old questions with " + count + " new questions in the " + category + " category";
                            }
                        }
                        else
                        {
                            ViewBag.Message = "Added " + count + " questions in the " + category + " category";
                        }
                    }
                }
            }
            return View("Index");
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult EditCategories(EditCategoryModel model)
        {
            this.CheckUser();
            ViewBag.Message = "Edit Categories";
            return View(model);
        }

        public ActionResult EditQuestions(EditQuestionModel model)
        {
            this.CheckUser();
            ViewBag.Message = "Edit Questions";
            return View(model);
        }

        public ActionResult AddGame()
        {
            this.CheckUser();
            ViewBag.Message = "AddGame";
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult AddGame(AddGameModel model)
        {
            this.CheckUser();
            if (ModelState.IsValid)
            {
                if (!ViewBag.IsAdmin)
                {
                    ModelState.AddModelError("", "Sorry, you do not have permission to add games");
                }
                else
                {
                    ViewBag.Permission = "granted";
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }


        public ActionResult MakeAdmin()
        {
            this.CheckUser();
            ViewBag.Message = "Make Admin";
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> MakeAdmin(AdminModel model)
        {
            this.CheckUser();
            var userManager = HttpContext.GetOwinContext().GetUserManager<ApplicationUserManager>();
            var user = (from u in userManager.Users where u.Email == model.Email select u).FirstOrDefault();
            if (user != null)
            {
                var result = await userManager.AddToRoleAsync(user.Id, "admin");
                ViewBag.Message = "Success";
            }
            else
            {
                ViewBag.Message = "Email not found";
            }            
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteQuestions()
        {
            this.CheckUser();
            if (!ViewBag.IsAdmin)
            {
                ViewBag.Message = "You do not have admin permission";
            }
            else
            {
                try
                {
                    var context = this.HttpContext.GetOwinContext();
                    var db = context.Get<ApplicationDbContext>();
                    db.Questions.RemoveRange(db.Questions);
                    int count = db.SaveChanges();
                    ViewBag.Message = "Removed " + count + " questions";
                }
                catch (Exception ex)
                {
                    ViewBag.Message = "Error: " + ex.Message;
                }
            }
            return View("Index");
        }


        public ActionResult SetKey()
        {
            this.CheckUser();
            ViewBag.Message = "SetKey";
            return View(new SetKeyModel()
            {
                ApiKey = (string)Session["apikey"]
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> SetKey(SetKeyModel model)
        {
            this.CheckUser();
            if (ModelState.IsValid)
            {
                if (!ViewBag.IsAdmin)
                {
                    ModelState.AddModelError("", "Sorry, you do not have permission to add games");
                }
                else
                {
                    try
                    {
                        var context = this.HttpContext.GetOwinContext();
                        var db = context.Get<ApplicationDbContext>();
                        var table = db.Config;
                        SharedAppConfig config = await table.FindAsync("ApiKey");
                        if (config == null)
                        {
                            config = new SharedAppConfig()
                            {
                                Id = "ApiKey",
                                Value = model.ApiKey
                            };
                            table.Add(config);
                        }
                        else
                        {
                            config.Value = model.ApiKey;
                        }
                        await db.SaveChangesAsync();
                        model.Result = "updated";
                    }
                    catch (Exception ex)
                    {
                        model.Result = ex.Message;
                    }
                }
            }

            // If we got this far, something failed, redisplay form
            return View(model);
        }

    }
}