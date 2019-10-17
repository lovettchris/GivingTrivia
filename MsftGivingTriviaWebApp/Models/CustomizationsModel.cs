using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace MsftGivingTriviaWebApp.Models
{
    [Table("Customizations")]
    public class CustomizationsModel
    {
        public CustomizationsModel() { }

        /// <summary>
        /// Id of the page being customized.
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// All customizations for a given page are stored in the JSON, including
        /// the name of any icon blobs.
        /// </summary>
        public string JsonBlobId { get; set; }
    }
}