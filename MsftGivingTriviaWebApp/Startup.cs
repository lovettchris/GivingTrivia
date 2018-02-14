using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(MsftGivingTriviaWebApp.Startup))]
namespace MsftGivingTriviaWebApp
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
