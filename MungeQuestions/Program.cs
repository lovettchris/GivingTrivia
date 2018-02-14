using Microsoft.Xml;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace MungeQuestions
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 1)
            {
                Program p = new Program();
                p.Munge(args[0]);
            }
            else
            {
                Console.WriteLine("Usage: MungeQuestions csvFile");
            }
        }

        void Munge(string filename)
        {
            filename = System.IO.Path.GetFullPath(filename);
            XDocument doc = null;
            using (StreamReader reader = new StreamReader(filename, Encoding.GetEncoding("Windows-1252")))
            {
                using (XmlCsvReader xmlReader = new XmlCsvReader(reader, new Uri(filename), new System.Xml.NameTable()))
                {
                    xmlReader.FirstRowHasColumnNames = true;
                    doc = XDocument.Load(xmlReader);
                    foreach (var row in doc.Root.Elements())
                    {
                        List<string> wrong = new List<string>();
                        string answer = null;
                        string question = null;
                        XElement toRemove = null;
                        foreach (var item in row.Elements())
                        {
                            if (item.Name.LocalName == "Question")
                            {
                                question = item.Value;
                            }
                            else if (item.Name.LocalName == "Answer")
                            {
                                answer = item.Value;
                            }
                            else if (answer != null)
                            {
                                if (item.Value.Trim() == answer.Trim())
                                {
                                    toRemove = item;
                                }
                                else
                                {
                                    wrong.Add(item.Value);
                                }
                            }
                        }
                        if (toRemove == null)
                        {
                            Console.WriteLine("Did not find right answer for question: {0}", question);
                        }
                        else
                        {
                            toRemove.Remove();
                        }
                        if (wrong.Count != 3)
                        {
                            Console.WriteLine("Question '{0}' has {1} instead of 3 wrong answers", question, wrong.Count);
                        }
                    }

                    // ok, now save the updated csv file

                }
            }

            string newName = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(filename), System.IO.Path.GetFileNameWithoutExtension(filename) + "_2.csv");
            using (StreamWriter writer = new StreamWriter(newName, false, Encoding.UTF8))
            {
                writer.WriteLine("Question,Answer,Wrong1,Wrong2,Wrong3");
                foreach (var row in doc.Root.Elements())
                {
                    List<XElement> cols = new List<XElement>(row.Elements());
                    if (cols.Count == 5) {
                        writer.WriteLine("{0},{1},{2},{3},{4}", cols[0].Value, cols[1].Value, cols[2].Value, cols[3].Value, cols[4].Value);
                    }
                    else
                    {
                        Console.WriteLine("Row has wrong number of columns, {0}", cols.Count);
                    }
                }
            }
        }
    }
}
