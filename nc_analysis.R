args <- commandArgs(trailingOnly = TRUE)
input_file <- args[1]

library(dplyr)
library(jsonlite)

# Read CSV
data <- read.csv(input_file, stringsAsFactors = FALSE)

# Normalize key columns
data$state <- toupper(trimws(data$state))
data$city <- trimws(data$city)
data$first_gen <- trimws(data$first_gen)
data$interests <- trimws(data$interests)

# Filter North Carolina rows
nc_data <- data |>
  filter(state == "NC" | state == "NORTH CAROLINA")

# Build summary as normal named lists
summary_data <- list(
  total_records = nrow(nc_data),
  cities = as.list(table(nc_data$city)),
  first_gen = as.list(table(nc_data$first_gen)),
  interests = as.list(table(nc_data$interests))
)

# Save outputs
write.csv(nc_data, "output/nc_filtered.csv", row.names = FALSE)
write_json(
  summary_data,
  "output/nc_summary.json",
  pretty = TRUE,
  auto_unbox = TRUE
)