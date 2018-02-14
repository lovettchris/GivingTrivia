using System.Web;
using System.Web.Optimization;

namespace MsftGivingTriviaWebApp
{
    public class BundleConfig
    {
        // For more information on bundling, visit https://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            bundles.Add(new ScriptBundle("~/bundles/firebase").Include(
            "~/Scripts/firebase*"));
            bundles.Add(new ScriptBundle("~/bundles/game").Include(
                        "~/Scripts/game.js",
                        "~/Scripts/game-categories.js",
                        "~/Scripts/game-questions.js",
                        "~/Scripts/game-utilities.js",
                        "~/Scripts/game-users.js",
                        "~/Scripts/game-all-users.js",
                        "~/Scripts/game-list.js"
                        ));
            bundles.Add(new ScriptBundle("~/bundles/qrcode").Include(
                        "~/Scripts/qrcode.js"
                        ));
            bundles.Add(new ScriptBundle("~/bundles/admin").Include(
                        "~/Scripts/game-admin.js"));


            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at https://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/angular").Include(
                      "~/Scripts/angular.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css", 
                      "~/Content/site.css",
                      "~/Content/game.css"));

        }
    }
}
