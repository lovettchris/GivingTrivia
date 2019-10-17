using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using System.Runtime.InteropServices;

namespace MsftGivingTriviaWebApp.Models
{
    public class AdminModel
    {
        [Required]
        [DataType(DataType.Text)]
        [Display(Name = "Email")]
        public string Email { get; set; }

    }

    public class AddGameModel
    {
        [Required]
        [DataType(DataType.Text)]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 2)]
        [Display(Name = "Title")]
        public string Title { get; set; }

    }

    public class SelectGameModel
    {
        public string GameId { get; set; }

    }

    public class EditCategoryModel
    {
        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 1)]
        [Display(Name = "Category")]
        public string Category { get; set; }
    }

    public class EditQuestionModel
    {
        [Required]
        [DataType(DataType.Text)]
        [Display(Name = "Category")]
        public string Category { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 1)]
        [Display(Name = "Question")]
        public string Question { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 1)]
        [Display(Name = "Answer")]
        public string Answer { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 1)]
        [Display(Name = "Bogus Answer 1")]
        public string BogusAnswer1 { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 1)]
        [Display(Name = "Bogus Answer 2")]
        public string BogusAnswer2 { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 1)]
        [Display(Name = "Bogus Answer 31")]
        public string BogusAnswer3 { get; set; }
    }

    public class SetKeyModel
    {
        [Required]
        [DataType(DataType.Text)]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 2)]
        [Display(Name = "ApiKey")]
        public string ApiKey { get; set; }
        public string Result { get; internal set; }
    }


    [Guid("780BCDA2-5926-48DF-845E-E8453F6C1793")]
    [DataContract]
    public class HomePageCustomizeModel
    {
        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 200)]
        [Display(Name = "Blurb")]
        [DataMember]
        public string Blurb { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 10)]
        [Display(Name = "IconLink1")]
        [DataMember]
        public string IconLink1 { get; set; }

        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 10)]
        [Display(Name = "IconLink2")]
        [DataMember]
        public string IconLink2 { get; set; }


        [Required]
        [DataType(DataType.Text)]
        [StringLength(1000, ErrorMessage = "The {0} must be at least {2} characters long and no more than {1}.", MinimumLength = 10)]
        [Display(Name = "DonateLink")]
        [DataMember]
        public string DonateLink { get; set; }


        [DataMember]
        public string IconUrl1 { get; internal set; }

        [DataMember]
        public string IconUrl2 { get; internal set; }


        public string Result { get; internal set; }

        internal void CopyFrom(HomePageCustomizeModel existing)
        {
            this.Blurb = existing.Blurb;
            this.IconLink1 = existing.IconLink1;
            this.IconLink2 = existing.IconLink2;
            this.DonateLink = existing.DonateLink;
            this.IconUrl1 = existing.IconUrl1;
            this.IconUrl2 = existing.IconUrl2;
        }

        internal void SetPlaceHolders()
        {
            if (string.IsNullOrEmpty(this.Blurb))
            {
                this.Blurb = "Customize this content using the Admin/CUSTOMIZE button...";
            }
            if (string.IsNullOrEmpty(this.IconLink1))
            {
                this.IconLink1 = "http://aka.ms/give";
            }
            if (string.IsNullOrEmpty(this.IconLink2))
            {
                this.IconLink2 = "http://aka.ms/give";
            }
            if (string.IsNullOrEmpty(this.DonateLink))
            {
                this.DonateLink = "http://aka.ms/give";
            }
            if (string.IsNullOrEmpty(this.IconUrl1))
            {
                this.IconUrl1 = "/content/icon1.jpg";
            }
            else
            {
                // put the prefix in front.
                this.IconUrl1 = "/Home/Icon?name=" + this.IconUrl1;
            }
            if (string.IsNullOrEmpty(this.IconUrl2))
            {
                this.IconUrl2 = "/content/icon2.jpg";
            }
            else
            {
                this.IconUrl2 = "/Home/Icon?name=" + this.IconUrl2;
            }
        }
    }

}