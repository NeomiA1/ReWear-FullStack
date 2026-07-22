using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;

namespace RewearApi.BL
{
    public class BagMedia
    {
        private const long MaxFileSizeInBytes =
            300L * 1024L * 1024L;

        private static readonly HashSet<string>
            AllowedExtensions =
                new HashSet<string>(
                    StringComparer.OrdinalIgnoreCase
                )
                {
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp",
                    ".pdf",
                    ".zip"
                };

        private static readonly HashSet<string>
            AllowedContentTypes =
                new HashSet<string>(
                    StringComparer.OrdinalIgnoreCase
                )
                {
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "application/pdf",
                    "application/zip",
                    "application/x-zip-compressed"
                };


        public int MediaId { get; set; }

        public int BagId { get; set; }

        public string MediaType { get; set; } = "";

        public string MediaUrl { get; set; } = "";

        public string? MediaDescription { get; set; }

        public DateTime UploadedAt { get; set; }


        public static List<string> ValidateUploadedFile(
            IFormFile? file
        )
        {
            List<string> errors = new List<string>();

            if (file == null)
            {
                errors.Add("חובה לצרף קובץ");
                return errors;
            }

            if (file.Length <= 0)
            {
                errors.Add("הקובץ ריק");
            }

            if (file.Length > MaxFileSizeInBytes)
            {
                errors.Add(
                    "גודל הקובץ המרבי הוא 300MB"
                );
            }

            string extension =
                Path.GetExtension(file.FileName);

            if (
                string.IsNullOrWhiteSpace(extension)
                || !AllowedExtensions.Contains(extension)
            )
            {
                errors.Add(
                    "סוג הקובץ אינו נתמך. ניתן להעלות JPG, PNG, WEBP, PDF או ZIP"
                );
            }

            if (
                string.IsNullOrWhiteSpace(file.ContentType)
                || !AllowedContentTypes.Contains(
                    file.ContentType
                )
            )
            {
                errors.Add(
                    "תוכן הקובץ אינו תואם לסוג קובץ נתמך"
                );
            }

            return errors;
        }


        public static string GetMediaType(
            IFormFile file
        )
        {
            string extension =
                Path.GetExtension(file.FileName)
                    .ToLowerInvariant();

            return extension switch
            {
                ".jpg" => "Image",
                ".jpeg" => "Image",
                ".png" => "Image",
                ".webp" => "Image",
                ".pdf" => "Document",
                ".zip" => "Archive",
                _ => "Unknown"
            };
        }


        public List<string> Validate()
        {
            List<string> errors = new List<string>();

            if (BagId <= 0)
            {
                errors.Add("BagId חובה");
            }

            if (string.IsNullOrWhiteSpace(MediaType))
            {
                errors.Add("MediaType חובה");
            }

            if (string.IsNullOrWhiteSpace(MediaUrl))
            {
                errors.Add("MediaUrl חובה");
            }

            return errors;
        }
    }
}