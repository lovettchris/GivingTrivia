using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;

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

}